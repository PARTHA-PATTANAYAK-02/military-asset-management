const express = require("express");
const db = require("../config/db");
const { authenticateToken, allowRoles } = require("../middleware/auth");

const router = express.Router();

// View purchase history
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

        conditions.push("p.base_id = ?");
        params.push(baseId);
      } else if (req.query.baseId) {
        const requestedBase = Number(req.query.baseId);

        if (!Number.isInteger(requestedBase) || requestedBase < 1) {
          return res.status(400).json({
            success: false,
            message: "Invalid baseId",
          });
        }

        conditions.push("p.base_id = ?");
        params.push(requestedBase);
      }

      if (req.query.equipmentTypeId) {
        const equipmentId = Number(req.query.equipmentTypeId);

        if (!Number.isInteger(equipmentId) || equipmentId < 1) {
          return res.status(400).json({
            success: false,
            message: "Invalid equipmentTypeId",
          });
        }

        conditions.push("p.equipment_type_id = ?");
        params.push(equipmentId);
      }

      if (req.query.from) {
        conditions.push("p.purchase_date >= ?");
        params.push(req.query.from);
      }

      if (req.query.to) {
        conditions.push("p.purchase_date <= ?");
        params.push(req.query.to);
      }

      const where = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

      const [purchases] = await db.execute(
        `SELECT
          p.id,
          p.base_id AS baseId,
          b.name AS baseName,
          p.equipment_type_id AS equipmentTypeId,
          e.name AS equipmentName,
          p.quantity,
          DATE_FORMAT(p.purchase_date, '%Y-%m-%d') AS purchaseDate,
          p.notes,
          p.created_at AS createdAt,
          u.name AS createdBy
        FROM purchases p
        JOIN bases b ON b.id = p.base_id
        JOIN equipment_types e ON e.id = p.equipment_type_id
        JOIN users u ON u.id = p.created_by
        ${where}
        ORDER BY p.purchase_date DESC, p.id DESC`,
        params,
      );

      res.json({ success: true, purchases });
    } catch (error) {
      console.error("Purchase history error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to load purchases",
      });
    }
  },
);

// Record a purchase
router.post(
  "/",
  authenticateToken,
  allowRoles("ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"),
  async (req, res) => {
    const { role, id: userId, baseId } = req.user;
    const {
      baseId: requestedBase,
      equipmentTypeId,
      quantity,
      purchaseDate,
      notes,
    } = req.body;

    const targetBase =
      role === "BASE_COMMANDER" ? baseId : Number(requestedBase);

    if (
      !Number.isInteger(targetBase) ||
      targetBase < 1 ||
      !Number.isInteger(Number(equipmentTypeId)) ||
      Number(equipmentTypeId) < 1 ||
      !Number.isSafeInteger(quantity) ||
      quantity <= 0 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate || "")
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provide a valid base, equipment, positive integer quantity and purchase date",
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
          message: "Selected base or equipment type does not exist",
        });
      }

      const [result] = await connection.execute(
        `INSERT INTO purchases
          (base_id, equipment_type_id, quantity, purchase_date, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          targetBase,
          Number(equipmentTypeId),
          quantity,
          purchaseDate,
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
          "PURCHASE_CREATED",
          "purchase",
          result.insertId,
          JSON.stringify({
            baseId: targetBase,
            equipmentTypeId: Number(equipmentTypeId),
            quantity,
            purchaseDate,
          }),
        ],
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        message: "Purchase recorded successfully",
        purchaseId: result.insertId,
      });
    } catch (error) {
      await connection.rollback();
      console.error("Purchase creation error:", error.message);

      res.status(500).json({
        success: false,
        message: "Failed to record purchase",
      });
    } finally {
      connection.release();
    }
  },
);

module.exports = router;
