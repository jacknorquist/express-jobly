"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
  testJobs
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/************************************** POST /jobs */

describe("POST /jobs", function () {

  const newJob = {
    title: "newJobTest",
    salary: 100000,
    equity: "0.01",
    companyHandle: "c1",
  };

  test("ok for admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        ...newJob,
        id: expect.any(Number)
      }
    });
  });


  test("bad request with missing data for admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data for admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        notValid: "not valid",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });


  test("unauthorized for non admin", async function () {
    const resp = await request(app)
      .post(`/jobs`)
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauthorized for anon", async function () {
    const resp = await request(app)
      .post(`/jobs`)
      .send(newJob);
    expect(resp.statusCode).toEqual(401);
  });


});

/************************************** GET /jobs */

describe("GET /jobs", function () {

  test("ok for filter", async function () {
    const urlSearch = new URLSearchParams({ titleLike: "t", minSalary: 200000, hasEquity: true });
    const resp = await request(app).get(`/jobs?${urlSearch}`);
    expect(resp.body).toEqual({
      jobs:
        [
          {
            companyHandle: "c2",
            equity: "0.01",
            id: expect.any(Number),
            salary: 400000,
            title: "testJob4",
          }
        ],
    });
  });

  test("ok for empty query string", async function () {
    const resp = await request(app).get(`/jobs`);
    expect(resp.body).toEqual({
      jobs:
        [
          {
            "companyHandle": "c3",
            "equity": "0.01",
            "id": expect.any(Number),
            "salary": 100000,
            "title": "testJob1",
          },
          {
            "companyHandle": "c3",
            "equity": "0",
            "id": expect.any(Number),
            "salary": 200000,
            "title": "testJob2",
          },
          {
            "companyHandle": "c2",
            "equity": null,
            "id": expect.any(Number),
            "salary": 300000,
            "title": "testJob3",
          },
          {
            "companyHandle": "c2",
            "equity": "0.01",
            "id": expect.any(Number),
            "salary": 400000,
            "title": "testJob4",
          },

        ],
    });
  });


});

/************************************** GET /jobs/:handle */

describe("GET /jobs/:id", function () {

  test("works for anon", async function () {
    console.log(testJobs);
    const resp = await request(app).get(`/jobs/${testJobs[0].id}`);
    expect(resp.body).toEqual({
      job: {
        "companyHandle": "c3",
        "equity": "0.01",
        "id": expect.any(Number),
        "salary": 100000,
        "title": "testJob1",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:handle */
//Test annon user gets 401
describe("PATCH /jobs/:handle", function () {

  test("works for admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/${testJobs[0].id}`)
      .send({
        title: "Updated",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        title: "Updated",
        salary: 100000,
        equity: "0.01",
        id: expect.any(Number),
        companyHandle: "c3",
      },
    });
  });


  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/jobs/${testJobs[0].id}`)
      .send({
        name: "APPle",
      });
    expect(resp.statusCode).toEqual(401);
  });


  test("not found on no such company for admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/nope`)
      .send({
        name: "new nope",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt for admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/${testJobs[0].id}`)
      .send({
        isAdmin: "true",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("Unauthorized for non admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/${testJobs[0].id}`)
      .send({
        title: "C1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});


// /************************************** DELETE /jobs/:handle */

describe("DELETE /jobs/:handle", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/${testJobs[0].id}`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: `${testJobs[0].id}` });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/jobs/${testJobs[0].id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company for admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/nope`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("Unauthorized for non admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/${testJobs[0].id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});
