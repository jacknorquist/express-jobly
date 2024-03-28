"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Company = require("../models/company");
const Job = require("../models/jobs");
const { createToken } = require("../helpers/tokens");

const testJobs = [];

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");

  await Company.create(
    {
      handle: "c1",
      name: "C1",
      numEmployees: 1,
      description: "Desc1",
      logoUrl: "http://c1.img",
    });
  await Company.create(
    {
      handle: "c2",
      name: "C2",
      numEmployees: 2,
      description: "Desc2",
      logoUrl: "http://c2.img",
    });
  await Company.create(
    {
      handle: "c3",
      name: "C3",
      numEmployees: 3,
      description: "Desc3",
      logoUrl: "http://c3.img",
    });

  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: false,
  });
  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
    isAdmin: false,
  });
  await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
    isAdmin: false,
  });
  await User.register({
    username: "testAdmin",
    firstName: "Test",
    lastName: "Admin",
    email: "testAdmin@user.com",
    password: "password",
    isAdmin: true,
  });
  const testJob1 = await Job.create({
    title: "testJob1",
    salary: 100000,
    equity: 0.01,
    companyHandle: "c3",
  });
  const testJob2 = await Job.create({
    title: "testJob2",
    salary: 200000,
    equity: 0,
    companyHandle: "c3",
  });
  const testJob3 = await Job.create({
    title: "testJob3",
    salary: 300000,
    equity: null,
    companyHandle: "c2",
  });
  const testJob4 = await Job.create({
    title: "testJob4",
    salary: 400000,
    equity: 0.01,
    companyHandle: "c2",
  });
  testJobs.push(testJob1,testJob2,testJob3, testJob4);
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}


const u1Token = createToken({ username: "u1", isAdmin: false });
const adminToken = createToken({ username: "testAdmin", isAdmin: true });


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
  testJobs
};
