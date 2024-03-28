"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(`
        SELECT handle
        FROM companies
        WHERE handle = $1`, [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(`
                INSERT INTO companies (handle,
                                       name,
                                       description,
                                       num_employees,
                                       logo_url)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING
                    handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"`, [
      handle,
      name,
      description,
      numEmployees,
      logoUrl,
    ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Takes in searchParams object which contains some (or none) of keys:
 * minEmployees, maxEmployees, nameLike
 *
 * Returns object containing paramterized sql WHERE clause and cooresponding values,
 * that represents searching for companies that satisfy the
 * constraints specified by the search parameters
 *
 * Input:
 * { minEmployees, maxEmployees, nameLike}
 *
 * Output:
 * {
 *  whereClause: `WHERE (num_employees < $1 AND ...)`
 *  values: [...]
 * }
*/

  static sqlForCompanySearch(searchParams) {
    const keys = Object.keys(searchParams);
    if (keys.length === 0) return { whereClause: '', values: [] };

    if (searchParams.nameLike !== undefined) {
      searchParams.nameLike = `%${searchParams.nameLike}%`;
    }

    const sqlConstraintToQuery = {
      minEmployees: (index) => `num_employees >= $${index}`,
      maxEmployees: (index) => `num_employees <= $${index}`,
      nameLike: (index) => `name ILIKE $${index}`
    };

    const constraints = keys.map(
      (param, idx) => sqlConstraintToQuery[param](idx + 1));

    return {
      whereClause: `WHERE (${constraints.join(" AND ")})`,
      values: keys.map(key => searchParams[key])
    };
  }

  /** Finds all companies that match the input search parameters.
   * searchParams will contain some (or none) of minEmployees, maxEmployees,
   * and nameLike.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async search(searchParams = {}) {
    const { whereClause, values } = Company.sqlForCompanySearch(searchParams);
    const companiesRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        ${whereClause}
        ORDER BY name`, [...values]);

    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        WHERE handle = $1`, [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE companies
        SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING
            handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(`
        DELETE
        FROM companies
        WHERE handle = $1
        RETURNING handle`, [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
