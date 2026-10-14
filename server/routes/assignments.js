const express = require("express");
const db = require("../config/db");
const { authenticateToken, allowRoles } = require("../middleware/auth");

const router = express.Router();

function validId(value) {
  return Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

// Calculate available stock for a base and equipment type.
async function getAvailableStock(connection, baseId, equipmentTypeId) {
  const [rows] = await connection.execute(
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
    [baseId, equipmentTypeId],
  );

  return rows.length ? Number(rows[0].available) : null;
}

// Assignment history
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

        conditions.push("a.base_id = ?");
        params.push(baseId);
      } else if (req.query.baseId) {
        if (!validId(req.query.baseId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid baseId",
          });
        }

        conditions.push("a.base_id = ?");
        params.push(Number(req.query.baseId));
      }

      if (req.query.status) {
        if (!["ACTIVE", "RETURNED"].includes(req.query.status)) {
          return res.status(400).json({
            success: false,
            message: "Status must be ACTIVE or RETURNED",
          });
        }

        conditions.push("a.status = ?");
        params.push(req.query.status);
      }

      if (req.query.equipmentTypeId) {
        if (!validId(req.query.equipmentTypeId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid equipmentTypeId",
          });
        }

        conditions.push("a.equipment_type_id = ?");
        params.push(Number(req.query.equipmentTypeId));
      }

      const where = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

      const [assignments] = await db.execute(
        `SELECT
           a.id,
           a.base_id AS baseId,
           b.name AS baseName,
           a.equipment_type_id AS equipmentTypeId,
           e.name AS equipmentName,
           a.personnel_name AS personnelName,
           a.quantity,
           a.assigned_at AS assignedAt,
           a.status,
           a.created_by AS createdById,
           u.name AS createdBy
         FROM assignments a
         JOIN bases b ON b.id = a.base_id
         JOIN equipment_types e ON e.id = a.equipment_type_id
         JOIN users u ON u.id = a.created_by
         ${where}
         ORDER BY a.id DESC`,
        params,
      );

      res.json({ success: true, assignments });
    } catch (error) {
      console.error("Assignment history error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to load assignments",
      });
    }
  },
);

// Create an assignment
router.post(
  "/",
  authenticateToken,
  allowRoles("ADMIN", "BASE_COMMANDER"),
  async (req, res) => {
    const { role, id: userId, baseId } = req.user;
    const {
      baseId: requestedBase,
      equipmentTypeId,
      personnelName,
      quantity,
    } = req.body;

    const targetBase =
      role === "BASE_COMMANDER" ? baseId : Number(requestedBase);

    if (
      !validId(targetBase) ||
      !validId(equipmentTypeId) ||
      !Number.isSafeInteger(quantity) ||
      quantity <= 0 ||
      typeof personnelName !== "string" ||
      !personnelName.trim() ||
      personnelName.trim().length > 150
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provide a valid base, equipment, personnel name and positive integer quantity",
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

      // Lock the balance row while checking stock.
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

      const available = await getAvailableStock(
        connection,
        targetBase,
        Number(equipmentTypeId),
      );

      if (available < quantity) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: `Insufficient available stock. Available quantity: ${available}`,
        });
      }

      const [result] = await connection.execute(
        `INSERT INTO assignments
           (base_id, equipment_type_id, personnel_name, quantity, status, created_by)
         VALUES (?, ?, ?, ?, 'ACTIVE', ?)`,
        [
          targetBase,
          Number(equipmentTypeId),
          personnelName.trim(),
          quantity,
          userId,
        ],
      );

      await connection.execute(
        `INSERT INTO audit_logs
           (user_id, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          "ASSIGNMENT_CREATED",
          "assignment",
          result.insertId,
          JSON.stringify({
            baseId: targetBase,
            equipmentTypeId: Number(equipmentTypeId),
            personnelName: personnelName.trim(),
            quantity,
          }),
        ],
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        message: "Asset assigned successfully",
        assignmentId: result.insertId,
        availableStockAfterAssignment: available - quantity,
      });
    } catch (error) {
      await connection.rollback();
      console.error("Assignment creation error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to create assignment",
      });
    } finally {
      connection.release();
    }
  },
);

// Return an active assignment
router.patch(
  "/:id/return",
  authenticateToken,
  allowRoles("ADMIN", "BASE_COMMANDER"),
  async (req, res) => {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const { role, id: userId, baseId } = req.user;
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [rows] = await connection.execute(
        `SELECT id, base_id, equipment_type_id, quantity, status
         FROM assignments WHERE id = ? FOR UPDATE`,
        [Number(req.params.id)],
      );

      if (!rows.length) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
      }

      const assignment = rows[0];

      if (role === "BASE_COMMANDER" && assignment.base_id !== baseId) {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message: "You cannot return an assignment from another base",
        });
      }

      if (assignment.status !== "ACTIVE") {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: "This assignment has already been returned",
        });
      }

      await connection.execute(
        "UPDATE assignments SET status = 'RETURNED' WHERE id = ?",
        [assignment.id],
      );

      await connection.execute(
        `INSERT INTO audit_logs
           (user_id, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          "ASSIGNMENT_RETURNED",
          "assignment",
          assignment.id,
          JSON.stringify({ quantity: assignment.quantity }),
        ],
      );

      await connection.commit();

      res.json({
        success: true,
        message: "Assignment returned successfully",
      });
    } catch (error) {
      await connection.rollback();
      console.error("Assignment return error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to return assignment",
      });
    } finally {
      connection.release();
    }
  },
);

module.exports = router;
