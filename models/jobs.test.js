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

/************************************** get all */

describe("search jobs", function () {

  test("works", async function () {
    let jobs = await Job.search();
    expect(jobs).toEqual([
      {
        companyHandle: "c1",
        equity: "0",
        salary: 15000,
        title: "Job Test1",
      },
      {
        companyHandle: "c2",
        equity: "0.01",
        title: "jobber",
        salary: 20000,
      },
      {
        title: "test job",
        salary: 20000,
        equity: '0.15',
        companyHandle: "c3",
      }
    ]);
  });


  test("works: for filter title, minSalary, hasEquity", async function () {
    let companies = await Job.search({ titleLike: "job", minSalary: "10000", hasEquity: true });
    expect(companies).toEqual([
      {
        companyHandle: "c2",
        equity: "0.01",
        title: "jobber",
        salary: 20000,
      },
      {
        title: "test job",
        salary: 20000,
        equity: "0.15",
        companyHandle: "c3",
      }
    ]);
  });

});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "worker2",
    salary: 200000,
    equity: "0",
    companyHandle: 'c1',
  };

  test("works", async function () {
    let job = await Job.update(testJob[0].id, updateData);
    delete job.id;
    expect(job).toEqual(updateData);

    const result = await db.query(
      `SELECT title, salary, equity, company_handle as "companyHandle"
           FROM jobs
           WHERE id = $1`, [testJob[0].id]);
    expect(result.rows[0]).toEqual(updateData);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "worker3",
      salary: null,
      equity: null,
      companyHandle: 'c1',
    };

    let job = await Job.update(testJob[0].id, updateDataSetNulls);
    expect(job).toEqual({
      id: testJob[0].id,
      ...updateDataSetNulls,
    });

    const result = await db.query(
      `SELECT title, salary, equity, company_handle as "companyHandle"
           FROM jobs
           WHERE id = $1`, [testJob[0].id]);
    expect(result.rows[0]).toEqual(updateDataSetNulls);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(100000, updateData);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(testJob[0].id, {});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });


});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(testJob[0].id);
    const res = await db.query(
      "SELECT id FROM jobs WHERE id=$1", [testJob[0].id]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(100000000);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
