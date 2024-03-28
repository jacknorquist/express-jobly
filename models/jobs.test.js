"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./jobs.js");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJob
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);



/************************************** create */

describe("create", function () {

  const newJob = {
    title: "worker",
    salary: 100000,
    equity: "0",
    companyHandle: 'c1',
  };

  const newJobBadHandle = {
    title: "worker",
    salary: 100000,
    equity: "0",
    companyHandle: 'not a valid handle',
  };

  test("works", async function () {
    const job = await Job.create(newJob);
    const newJobId = job.id;
    delete job.id;
    expect(job).toEqual(newJob);

    const result = await db.query(
      `SELECT title, salary, equity, company_handle as "companyHandle"
           FROM jobs
           WHERE id = $1`, [newJobId]);
    expect(result.rows).toEqual([
      {
        title: "worker",
        salary: 100000,
        equity: "0",
        companyHandle: 'c1',
      },
    ]);
  });

  test("bad request with company handle that does not exist", async function () {
    try {
      await Job.create(newJobBadHandle);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** get */

describe("get", function () {

  test("works", async function () {
    console.log(testJob[0]);
    let job = await Job.get(testJob[0].id);
    expect(job).toEqual(testJob[0]);
  });

  test("not found if no such job", async function () {
    try {
      const result = await Job.get(1000000000);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

});
