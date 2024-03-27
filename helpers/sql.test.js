'use strict';


const { BadRequestError } = require('../expressError');
const { sqlForPartialUpdate } = require('./sql.js');


describe("get partial sql statement", function () {

  test("return obj", function () {
    const data = { firstName: 'Aliya', age: 3 };
    const jsToSql = { firstName: "first_name" };
    const partialSql = sqlForPartialUpdate(data, jsToSql);
    expect(partialSql).toEqual({ setCols: '"first_name"=$1, "age"=$2', values: ['Aliya', 3] });
  });

  test("get error with empty data ", function () {
    const data = {};
    const jsToSql = { firstName: "first_name" };
    expect(() => sqlForPartialUpdate(data, jsToSql)).toThrow(BadRequestError);
  });

});
