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

module.exports = { sqlForPartialUpdate };
