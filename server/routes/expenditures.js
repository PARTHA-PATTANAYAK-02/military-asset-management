const express = require("express");
const db = require("../config/db");
const { authenticateToken, allowRoles } = require("../middleware/auth");

const router = express.Router();

function validId(value) {
  return Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

// Expenditure history
router.get(
  "/",
  authenticateToken,
  allowRoles("ADMIN", "BASE_COMMANDER"),
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

        conditions.push("ex.base_id = ?");
        params.push(baseId);
      } else if (req.query.baseId) {
        if (!validId(req.query.baseId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid baseId",
          });
        }

        conditions.push("ex.base_id = ?");
        params.push(Number(req.query.baseId));
      }

      if (req.query.equipmentTypeId) {
        if (!validId(req.query.equipmentTypeId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid equipmentTypeId",
          });
        }

        conditions.push("ex.equipment_type_id = ?");
        params.push(Number(req.query.equipmentTypeId));
      }

      if (req.query.from) {
        if (!validDate(req.query.from)) {
          return res.status(400).json({
            success: false,
            message: "Invalid from date",
          });
        }

        conditions.push("ex.expenditure_date >= ?");
        params.push(req.query.from);
      }

      if (req.query.to) {
        if (!validDate(req.query.to)) {
          return res.status(400).json({
            success: false,
            message: "Invalid to date",
          });
        }

        conditions.push("ex.expenditure_date <= ?");
        params.push(req.query.to);
      }

      const where = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

      const [expenditures] = await db.execute(
        `SELECT
           ex.id,
           ex.base_id AS baseId,
           b.name AS baseName,
           ex.equipment_type_id AS equipmentTypeId,
           e.name AS equipmentName,
           ex.quantity,
           ex.expenditure_date AS expenditureDate,
           ex.reason,
           ex.created_at AS createdAt,
           ex.created_by AS createdById,
           u.name AS createdBy
         FROM expenditures ex
         JOIN bases b ON b.id = ex.base_id
         JOIN equipment_types e ON e.id = ex.equipment_type_id
         JOIN users u ON u.id = ex.created_by
         ${where}
         ORDER BY ex.expenditure_date DESC, ex.id DESC`,
        params,
      );

      res.json({ success: true, expenditures });
    } catch (error) {
      console.error("Expenditure history error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to load expenditure history",
      });
    }
  },
);

// Record an expenditure
router.post(
  "/",
  authenticateToken,
  allowRoles("ADMIN", "BASE_COMMANDER"),
  async (req, res) => {
    const { role, id: userId, baseId } = req.user;
    const {
      baseId: requestedBase,
      equipmentTypeId,
      quantity,
      expenditureDate,
      reason,
    } = req.body;

    const targetBase =
      role === "BASE_COMMANDER" ? baseId : Number(requestedBase);

    if (
      !validId(targetBase) ||
      !validId(equipmentTypeId) ||
      !Number.isSafeInteger(quantity) ||
      quantity <= 0 ||
      !validDate(expenditureDate) ||
      typeof reason !== "string" ||
      !reason.trim() ||
      reason.trim().length > 255
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provide a valid base, equipment, positive quantity, date and reason",
      });
    }

    if (role === "BASE_COMMANDER" && !baseId) {
      return res.status(403).json({
        success: false,
        message: "No base is assigned to this commander",
      });
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [baseRows] = await connection.execute(
        "SELECT id FROM bases WHERE id = ?",
        [targetBase],
      );

      const [equipmentRows] = await connection.execute(
        "SELECT id FROM equipment_types WHERE id = ?",
        [Number(equipmentTypeId)],
      );

      if (!baseRows.length || !equipmentRows.length) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Selected base or equipment does not exist",
        });
      }

      const [lockRows] = await connection.execute(
        `SELECT id FROM opening_balances
         WHERE base_id = ? AND equipment_type_id = ?
         FOR UPDATE`,
        [targetBase, Number(equipmentTypeId)],
      );

      if (!lockRows.length) {
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
               SELECT SUM(p.quantity) FROM purchases p
               WHERE p.base_id = ob.base_id
                 AND p.equipment_type_id = ob.equipment_type_id
             ), 0)
           + COALESCE((
               SELECT SUM(t.quantity) FROM transfers t
               WHERE t.to_base_id = ob.base_id
                 AND t.equipment_type_id = ob.equipment_type_id
                 AND t.status = 'COMPLETED'
             ), 0)
           - COALESCE((
               SELECT SUM(t.quantity) FROM transfers t
               WHERE t.from_base_id = ob.base_id
                 AND t.equipment_type_id = ob.equipment_type_id
                 AND t.status = 'COMPLETED'
             ), 0)
           - COALESCE((
               SELECT SUM(a.quantity) FROM assignments a
               WHERE a.base_id = ob.base_id
                 AND a.equipment_type_id = ob.equipment_type_id
                 AND a.status = 'ACTIVE'
             ), 0)
           - COALESCE((
               SELECT SUM(ex.quantity) FROM expenditures ex
               WHERE ex.base_id = ob.base_id
                 AND ex.equipment_type_id = ob.equipment_type_id
             ), 0) AS available
         FROM opening_balances ob
         WHERE ob.base_id = ? AND ob.equipment_type_id = ?`,
        [targetBase, Number(equipmentTypeId)],
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
        `INSERT INTO expenditures
           (base_id, equipment_type_id, quantity, expenditure_date, reason, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          targetBase,
          Number(equipmentTypeId),
          quantity,
          expenditureDate,
          reason.trim(),
          userId,
        ],
      );

      await connection.execute(
        `INSERT INTO audit_logs
           (user_id, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          "EXPENDITURE_CREATED",
          "expenditure",
          result.insertId,
          JSON.stringify({
            baseId: targetBase,
            equipmentTypeId: Number(equipmentTypeId),
            quantity,
            expenditureDate,
            reason: reason.trim(),
          }),
        ],
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        message: "Expenditure recorded successfully",
        expenditureId: result.insertId,
        availableStockAfterExpenditure: available - quantity,
      });
    } catch (error) {
      await connection.rollback();
      console.error("Expenditure creation error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to record expenditure",
      });
    } finally {
      connection.release();
    }
  },
);

module.exports = router;
