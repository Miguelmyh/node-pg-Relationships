process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../../app");
const db = require("../../db");

let companyTest;
let invoiceTest;
beforeEach(async () => {
  const result = await db.query(
    `INSERT INTO companies (code, name, description) VALUES ('test', 'testCompany', 'testComp') RETURNING  *`
  );
  companyTest = result.rows[0];
  const res = await db.query(
    `INSERT INTO invoices (comp_code, amt) VALUES ('test', '100') RETURNING *`
  );
  invoiceTest = res.rows[0];
  console.log(invoiceTest);
});

//clean db
afterEach(async () => {
  await db.query(`DELETE FROM companies`);
});

//close client session
afterAll(async () => {
  await db.end();
});

describe("/GET companies", () => {
  test("return a list of companies", async () => {
    const resp = await request(app).get("/companies");
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      companies: [companyTest],
    });
  });
});

describe("(get)/:code companies", () => {
  test("should get specific company", async () => {
    const resp = await request(app).get(`/companies/${companyTest.code}`);
    let company = {
      code: companyTest.code,
      name: companyTest.name,
      description: companyTest.description,
      invoice: {
        id: invoiceTest.id,
        comp_code: invoiceTest.comp_code,
        amt: invoiceTest.amt,
        paid: invoiceTest.paid,
        add_date: expect.any(String),
        paid_date: invoiceTest.paid_date,
      },
    };
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({ company });
  });
});

describe("/post companies", () => {
  test("should create a company", async () => {
    const resp = await request(app).post("/companies").send({
      code: "new",
      name: "company",
      description: "company for test",
    });
    expect(resp.statusCode).toBe(201);
    expect(resp.body).toEqual({
      company: {
        code: "new",
        name: "company",
        description: "company for test",
      },
    });
  });
});

describe("(put)/:code companies", () => {
  test("should update a companies name and description", async () => {
    const resp = await request(app)
      .put("/companies/test")
      .send({ name: "testUpdated", description: "this is updated" });
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      company: {
        code: "test",
        name: "testUpdated",
        description: "this is updated",
      },
    });
  });
});

describe("/delete companies", () => {
  test("should delete a selected company", async () => {
    const resp = await request(app).delete("/companies/test");
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      status: "deleted",
    });
  });
});
