const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async (req, res, next) => {
  try {
    const resp = await db.query(`SELECT * FROM industries`);
    return res.json(resp.rows);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { code, field } = req.body;
    const resp = await db.query(
      `INSERT INTO industries (code, field) VALUES ($1, $2) RETURNING *`,
      [code, field]
    );
    return res.status(201).json({
      industry: resp.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

router.post("/:code/:comp_code", async (req, res, next) => {
  try {
    const { code, comp_code } = req.params;
    console.log(code, comp_code);
    const result = await db.query(
      `INSERT INTO industries_companies (ind_code, comp_code) VALUES ($1, $2) RETURNING *`,
      [code, comp_code]
    );
    // console.log(result);

    return res.status(201).json({
      msg: `Success, established connection ${code}-${comp_code} `,
      connection: result.rows,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
