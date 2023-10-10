const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");
const slugify = require("slugify");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM companies`);
    return res.json({
      companies: results.rows,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const results = await db.query(
      `SELECT i.id, 
    i.comp_code, 
    i.amt, 
    i.paid, 
    i.add_date, 
    i.paid_date,
    c.code,
    c.name,
    c.description,
    ind.code,
    ind.field,
    inc.comp_code
    FROM companies as c LEFT JOIN invoices as i ON (c.code = i.comp_code) INNER JOIN industries_companies as inc ON (c.code = inc.comp_code) INNER JOIN industries as ind ON (inc.ind_code = ind.code) WHERE c.code = $1 `,
      [code]
    );
    if (results.rows.length === 0) {
      throw new ExpressError("Can't find company", 404);
    }

    console.log("results with industries", results.rows);

    const resp = results.rows[0];
    let industriesCode = results.rows.map((r) => r.code);
    let industriesField = results.rows.map((r) => r.field);

    const industries = industriesCode.map((value, index) => {
      return [value, industriesField[index]];
    });

    console.log(industries);

    const company = {
      code: resp.code,
      name: resp.name,
      description: resp.description,
      invoice: {
        id: resp.id,
        comp_code: resp.comp_code,
        amt: resp.amt,
        paid: resp.paid,
        add_date: resp.add_date,
        paid_date: resp.paid_date,
      },
      industries,
    };

    return res.json({
      company,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  const { name, description } = req.body;
  const code = slugify(name, {
    lower: true,
  });
  const results = await db.query(
    `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *`,
    [code, name, description]
  );
  return res.status(201).json({ company: results.rows[0] });
});

router.put("/:code", async function (req, res, next) {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const results = await db.query(
      `UPDATE companies SET name = $1, description = $2 WHERE code = $3 RETURNING *`,
      [name, description, code]
    );
    if (results.rows.length === 0) {
      throw new ExpressError("company not found", 404);
    }
    return res.json({ company: results.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete("/:code", async function (req, res, next) {
  const { code } = req.params;
  const results = await db.query(`DELETE FROM companies WHERE code = $1`, [
    code,
  ]);
  return res.json({
    status: "deleted",
  });
});

module.exports = router;
