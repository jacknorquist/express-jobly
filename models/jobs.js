"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


class Job {

  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   */

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


  /** Given a job id, return data about job.
     *
     * Returns { id, title, salary, equity, company_handle }
     *
     * Throws NotFoundError if not found.
     **/

  static async get(jobId) {
    const result = await db.query(
      `SELECT title, salary, equity, company_handle as "companyHandle", id
      FROM jobs
      WHERE id = $1`,
      [jobId]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No company id: ${jobId}`);

    return job;
  }

  /** Takes in searchParams object which contains some (or none) of keys:
* title, minSalary, equity
*
* Returns object containing paramterized sql WHERE clause and coresponding values,
* that represents searching for jobs that satisfy the
* constraints specified by the search parameters
*
* Input:
* { title, minSalary, equity}
*
* Output:
* {
*  whereClause: `WHERE (minSalary > $1 AND ...)`
*  values: [...]
* }
*/


  static sqlForJobSearch(searchParams) {
    console.log(searchParams);
    const keys = Object.keys(searchParams);
    if (keys.length === 0) return { whereClause: '', values: [] };

    if (searchParams.titleLike !== undefined) {
      searchParams.titleLike = `%${searchParams.titleLike}%`;
    }

    const sqlConstraintToQuery = {
      minSalary: (index) => `salary >= $${index}`,
      hasEquity: (index) => `(equity > 0) = $${index}`,
      titleLike: (index) => `title ILIKE $${index}`
    };

    const constraints = keys.map(
      (param, idx) => {
        return sqlConstraintToQuery[param](idx + 1);
      });

    return {
      whereClause: `WHERE (${constraints.join(" AND ")})`,
      values: keys.map(key => searchParams[key])
    };
  }

  /** Find all jobs
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   **/


  static async search(searchParams = {}) {
    const { whereClause, values } = Job.sqlForJobSearch(searchParams);
    console.log(whereClause, values);
    const jobsRes = await db.query(`
        SELECT title,
               salary,
               equity,
               company_handle AS "companyHandle"
        FROM jobs
        ${whereClause}
        ORDER BY title`, [...values]);

    return jobsRes.rows;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data, { companyHandle: "company_handle" });
    const IdVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE jobs
        SET ${setCols}
        WHERE id = ${IdVarIdx}
        RETURNING
            title,
            salary,
            equity,
            company_handle as "companyHandle",
            id`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(jobId) {
    const result = await db.query(`
          DELETE
          FROM jobs
          WHERE id = $1
          RETURNING id`, [jobId]);
    const job = result.rows[0];
    console.log(job);
    if (!job) throw new NotFoundError(`No company: ${jobId}`);
  }

}


module.exports = Job;