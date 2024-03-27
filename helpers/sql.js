"use strict";

const { BadRequestError } = require("../expressError");

/* sqlforPartialUpdate: Takes dataToUpdate like {firstName:'Aliya' age:3} and
*jsToSql like {firstName:first_name, age:age}. Returns object
*containing the columns to update in sql (setCols) and the values
*to update the columns to like
*{setCols: '"first_name"=$1, "age"=$2', values: ['Aliya, 3']}
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
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

//Todo: put in company class:: ADD UNIT TESTS
function sqlForCompanySearch(searchParams) {
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

module.exports = { sqlForPartialUpdate, sqlForCompanySearch };
