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


function sqlForCompanySearch(searchParams) {
  let index = 1;
  const values = [];
  const constraints = [];

  if (searchParams.minEmployees !== undefined) {
    constraints.push(`num_employees >= $${index}`);
    values.push(searchParams.minEmployees);
    index++;
  }
  if (searchParams.maxEmployees !== undefined) {
    constraints.push(`num_employees <= $${index}`);
    values.push(searchParams.maxEmployees);
    index++;
  }
  if (searchParams.nameLike !== undefined) {
    constraints.push(`name ILIKE $${index}`);
    values.push(`%${searchParams.nameLike}%`);
    index++;
  }

  let whereClause = '';
  if (constraints.length > 0) {
    whereClause = `WHERE (${constraints.join(" AND ")})`
  }

  return {
    whereClause,
    values
  }
}

module.exports = { sqlForPartialUpdate, sqlForCompanySearch };
