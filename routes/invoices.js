const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM invoices`);
    return res.json({
      invoices: results.rows,
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query(
      `SELECT i.id, 
    i.comp_code, 
    i.amt, 
    i.paid, 
    i.add_date, 
    i.paid_date, 
    c.name, 
    c.description 
FROM invoices AS i
INNER JOIN companies AS c ON (i.comp_code = c.code)  
WHERE id = $1`,
      [id]
    );
    if (results.rows.length === 0) throw new ExpressError("not found", 404);

    const invoice = {
      id: results.rows[0].id,
      amt: results.rows[0].amt,
      paid: results.rows[0].paid,
      add_date: results.rows[0].add_date,
      paid_date: results.rows[0].paid_date,
      company: {
        code: results.rows[0].comp_code,
        name: results.rows[0].name,
        description: results.rows[0].description,
      },
    };

    return res.json({
      invoice,
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const results = await db.query(
      `INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *`,
      [comp_code, amt]
    );
    return res.status(201).json({
      invoice: results.rows[0],
    });
  } catch (err) {
    return next(err);
  }
});

router.put("/:id", async function (req, res, next) {
  try {
    const { id } = req.params;
    const { amt } = req.body;
    const results = await db.query(
      `UPDATE invoices SET amt = $1 WHERE id = $2 RETURNING *`,
      [amt, id]
    );

    return res.json({ invoice: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query(`DELETE FROM invoices WHERE id = $1`, [id]);
    return results.json({
      status: "deleted",
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
