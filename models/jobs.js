"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");


class Job {

  /** TODO: write this */
  static async create({ title, salary, equity, companyHandle }) {
    const companyExistsCheck = await db.query(`
        SELECT handle
        FROM companies
        WHERE handle = $1`, [companyHandle]);

    if (!companyExistsCheck.rows[0])
      throw new BadRequestError(`No company with handle: ${companyHandle}`);

    const result = await db.query(`
                INSERT INTO jobs (title,
                                  salary,
                                  equity,
                                  company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING
                title,
                salary,
                equity,
                company_handle as "companyHandle",
                id`,

      [
        title,
        salary,
        equity,
        companyHandle,
      ],
    );
    const job = result.rows[0];

    return job;
  }

  static async get(jobId) {
    const result = await db.query(
      `SELECT title, salary, equity, company_handle as "companyHandle", id
      FROM jobs
      WHERE id = $1`,
      [jobId]
    );
    const job = result.rows[0];
    console.log(job);

    if (!job) throw new NotFoundError(`No company id: ${jobId}`);

    return job;
  }




}


module.exports = Job;