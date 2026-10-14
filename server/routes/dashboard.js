const express = require("express");
const db = require("../config/db");
const { authenticateToken, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  allowRoles("ADMIN", "BASE_COMMANDER"),
  async (req, res) => {
    try {
      const { baseId, role } = req.user;

      const selectedBase = req.query.baseId ? Number(req.query.baseId) : null;

      // Base commanders can only view their assigned base.
      if (
        role === "BASE_COMMANDER" &&
        selectedBase &&
        selectedBase !== baseId
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied for this base",
        });
      }

      const effectiveBase = role === "BASE_COMMANDER" ? baseId : selectedBase;

      const params = [];
      let baseFilter = "";

      if (effectiveBase) {
        baseFilter = " AND b.id = ?";
        params.push(effectiveBase);
      }

      const [rows] = await db.execute(
        `SELECT
          COALESCE(SUM(ob.quantity), 0) AS openingBalance,

          COALESCE((
            SELECT SUM(p.quantity)
            FROM purchases p
            JOIN bases pb ON pb.id = p.base_id
            WHERE 1=1
            ${baseFilter.replaceAll("b.id", "pb.id")}
          ), 0) AS purchases,

          COALESCE((
            SELECT SUM(t.quantity)
            FROM transfers t
            JOIN bases tb ON tb.id = t.to_base_id
            WHERE t.status = 'COMPLETED'
            ${baseFilter.replaceAll("b.id", "tb.id")}
          ), 0) AS transferIn,

          COALESCE((
            SELECT SUM(t.quantity)
            FROM transfers t
            JOIN bases fb ON fb.id = t.from_base_id
            WHERE t.status = 'COMPLETED'
            ${baseFilter.replaceAll("b.id", "fb.id")}
          ), 0) AS transferOut,

          COALESCE((
            SELECT SUM(a.quantity)
            FROM assignments a
            JOIN bases ab ON ab.id = a.base_id
            WHERE a.status = 'ACTIVE'
            ${baseFilter.replaceAll("b.id", "ab.id")}
          ), 0) AS assigned,

          COALESCE((
            SELECT SUM(ex.quantity)
            FROM expenditures ex
            JOIN bases eb ON eb.id = ex.base_id
            WHERE 1=1
            ${baseFilter.replaceAll("b.id", "eb.id")}
          ), 0) AS expended

        FROM opening_balances ob
        JOIN bases b ON b.id = ob.base_id
        WHERE 1=1 ${baseFilter}`,
        [
          ...params,
          ...params,
          ...params,
          ...params,
          ...params,
          ...params,
          ...params,
        ],
      );

      const data = rows[0];
      const netMovement =
        Number(data.purchases) +
        Number(data.transferIn) -
        Number(data.transferOut);

      const openingBalance = Number(data.openingBalance);
      const closingBalance =
        openingBalance + netMovement - Number(data.expended);

      res.json({
        success: true,
        dashboard: {
          openingBalance,
          purchases: Number(data.purchases),
          transferIn: Number(data.transferIn),
          transferOut: Number(data.transferOut),
          netMovement,
          assigned: Number(data.assigned),
          expended: Number(data.expended),
          closingBalance,
        },
      });
    } catch (error) {
      console.error("Dashboard error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to load dashboard",
      });
    }
  },
);

module.exports = router;
