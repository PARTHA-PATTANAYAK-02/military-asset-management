const express = require("express");
const db = require("../config/db");
const { authenticateToken, allowRoles } = require("../middleware/auth");

const router = express.Router();

const validId = (value) =>
  Number.isSafeInteger(Number(value)) && Number(value) > 0;

const validDate = (value) => !value || !Number.isNaN(Date.parse(value));

// View transfer history
router.get(
  "/",
  authenticateToken,
  allowRoles("ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"),
  async (req, res) => {
    try {
      const { role, baseId } = req.user;
      const conditions = [];
      const params = [];

      if (role === "BASE_COMMANDER") {
        if (!baseId) {
          return res.status(403).json({
            success: false,
            message: "No base is assigned to this commander",
          });
        }

        conditions.push("(t.from_base_id = ? OR t.to_base_id = ?)");
        params.push(baseId, baseId);
      } else if (req.query.baseId) {
        if (!validId(req.query.baseId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid baseId",
          });
        }

        conditions.push("(t.from_base_id = ? OR t.to_base_id = ?)");
        params.push(Number(req.query.baseId), Number(req.query.baseId));
      }

      if (req.query.equipmentTypeId) {
        if (!validId(req.query.equipmentTypeId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid equipmentTypeId",
          });
        }

        conditions.push("t.equipment_type_id = ?");
        params.push(Number(req.query.equipmentTypeId));
      }

      if (req.query.from) {
        conditions.push("t.transfer_date >= ?");
        params.push(req.query.from);
      }

      if (req.query.to) {
        conditions.push("t.transfer_date < DATE_ADD(?, INTERVAL 1 DAY)");
        params.push(req.query.to);
      }

      const where = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

      const [transfers] = await db.execute(
        `SELECT
          t.id,
          t.from_base_id AS fromBaseId,
          fb.name AS fromBaseName,
          t.to_base_id AS toBaseId,
          tb.name AS toBaseName,
          t.equipment_type_id AS equipmentTypeId,
          e.name AS equipmentName,
          t.quantity,
          DATE_FORMAT(t.transfer_date, '%Y-%m-%d') AS transferDate,
          t.status,
          t.notes,
          t.created_by AS createdById,
          u.name AS createdBy
        FROM transfers t
        JOIN bases fb ON fb.id = t.from_base_id
        JOIN bases tb ON tb.id = t.to_base_id
        JOIN equipment_types e ON e.id = t.equipment_type_id
        JOIN users u ON u.id = t.created_by
        ${where}
        ORDER BY t.transfer_date DESC, t.id DESC`,
        params,
      );

      res.json({ success: true, transfers });
    } catch (error) {
      console.error("Transfer history error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to load transfer history",
      });
    }
  },
);

// Create a transfer
router.post(
  "/",
  authenticateToken,
  allowRoles("ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"),
  async (req, res) => {
    const { role, id: userId, baseId } = req.user;
    const {
      fromBaseId,
      toBaseId,
      equipmentTypeId,
      quantity,
      transferDate,
      notes,
    } = req.body;

    if (
      !validId(fromBaseId) ||
      !validId(toBaseId) ||
      Number(fromBaseId) === Number(toBaseId) ||
      !validId(equipmentTypeId) ||
      !Number.isSafeInteger(quantity) ||
      quantity <= 0 ||
      !transferDate ||
      !/^\d{4}-\d{2}-\d{2}/.test(transferDate) ||
      !validDate(transferDate)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provide valid bases, equipment, positive quantity and transfer date",
      });
    }

    if (
      role === "BASE_COMMANDER" &&
      (!baseId ||
        (Number(fromBaseId) !== baseId && Number(toBaseId) !== baseId))
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only transfer assets involving your assigned base",
      });
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const source = Number(fromBaseId);
      const destination = Number(toBaseId);
      const equipment = Number(equipmentTypeId);

      const [bases] = await connection.execute(
        "SELECT id FROM bases WHERE id IN (?, ?)",
        [source, destination],
      );

      const [equipmentRows] = await connection.execute(
        "SELECT id FROM equipment_types WHERE id = ?",
        [equipment],
      );

      if (bases.length !== 2 || !equipmentRows.length) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Selected base or equipment does not exist",
        });
      }

      // Lock the source stock row to serialize transfers of this item.
      const [stockRows] = await connection.execute(
        `SELECT id
         FROM opening_balances
         WHERE base_id = ? AND equipment_type_id = ?
         FOR UPDATE`,
        [source, equipment],
      );

      if (!stockRows.length) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message:
            "Opening balance is not configured for this base and equipment",
        });
      }

      const [balanceRows] = await connection.execute(
        `SELECT
          ob.quantity
          + COALESCE((
              SELECT SUM(p.quantity)
              FROM purchases p
              WHERE p.base_id = ob.base_id
                AND p.equipment_type_id = ob.equipment_type_id
            ), 0)
          + COALESCE((
              SELECT SUM(t.quantity)
              FROM transfers t
              WHERE t.to_base_id = ob.base_id
                AND t.equipment_type_id = ob.equipment_type_id
                AND t.status = 'COMPLETED'
            ), 0)
          - COALESCE((
              SELECT SUM(t.quantity)
              FROM transfers t
              WHERE t.from_base_id = ob.base_id
                AND t.equipment_type_id = ob.equipment_type_id
                AND t.status = 'COMPLETED'
            ), 0)
          - COALESCE((
              SELECT SUM(a.quantity)
              FROM assignments a
              WHERE a.base_id = ob.base_id
                AND a.equipment_type_id = ob.equipment_type_id
                AND a.status = 'ACTIVE'
            ), 0)
          - COALESCE((
              SELECT SUM(ex.quantity)
              FROM expenditures ex
              WHERE ex.base_id = ob.base_id
                AND ex.equipment_type_id = ob.equipment_type_id
            ), 0) AS available
        FROM opening_balances ob
        WHERE ob.base_id = ? AND ob.equipment_type_id = ?`,
        [source, equipment],
      );

      const available = Number(balanceRows[0]?.available ?? 0);

      if (available < quantity) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: `Insufficient available stock. Available quantity: ${available}`,
        });
      }

      const [result] = await connection.execute(
        `INSERT INTO transfers
          (from_base_id, to_base_id, equipment_type_id, quantity,
           transfer_date, status, notes, created_by)
         VALUES (?, ?, ?, ?, ?, 'COMPLETED', ?, ?)`,
        [
          source,
          destination,
          equipment,
          quantity,
          transferDate,
          notes?.trim() || null,
          userId,
        ],
      );

      await connection.execute(
        `INSERT INTO audit_logs
          (user_id, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          "TRANSFER_CREATED",
          "transfer",
          result.insertId,
          JSON.stringify({
            fromBaseId: source,
            toBaseId: destination,
            equipmentTypeId: equipment,
            quantity,
            transferDate,
          }),
        ],
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        message: "Transfer recorded successfully",
        transferId: result.insertId,
        availableStockAfterTransfer: available - quantity,
      });
    } catch (error) {
      await connection.rollback();
      console.error("Transfer creation error:", error.message);

      res.status(500).json({
        success: false,
        message: "Failed to record transfer",
      });
    } finally {
      connection.release();
    }
  },
);

module.exports = router;
