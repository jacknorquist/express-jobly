"use strict";

const jsonschema = require("jsonschema");
const companiesQuerySchema = require("../schemas/companiesQuerySchema.json");
const jobSearchQuerySchema = require("../schemas/jobSearchQuerySchema.json");
const { BadRequestError } = require("../expressError");


/** validateCompanySearchQuery:Takes queryAttributes object like
 *  {nameLike:"..", minEmployees:2, maxEmployees:3}
 * Validates that query search does not contain invalid keys. Acceptable keys are
 * nameLike, minEmployees, and maxEmployee. Ensures that minEmployees and
 * maxEmployee are numbers and that maxEmployee is not larger than minEmployee.
 * Returns queryAttributes like
 * {nameLike:"..", minEmployees:2, maxEmployees:3} if validated, badRequestError
 *  if not.
 *
*/
function validateCompanySearchQuery(queryAttributes) {

  if (queryAttributes.minEmployees !== undefined) {
    queryAttributes.minEmployees = Number(queryAttributes.minEmployees);
  }
  if (queryAttributes.maxEmployees !== undefined) {
    queryAttributes.maxEmployees = Number(queryAttributes.maxEmployees);
  }

  // Checks that there are no additional query parameters
  const result = jsonschema.validate(
    queryAttributes, companiesQuerySchema, { required: true });

  if (!result.valid) {
    const errs = result.errors.map(err => err.stack);
    throw new BadRequestError(errs);
  }
  //evaluate min and max if they are not undefined
  const minEmp = queryAttributes.minEmployees;
  const maxEmp = queryAttributes.maxEmployees;
  if (minEmp && maxEmp && minEmp > maxEmp) {
    throw new BadRequestError("minEmployees cannot be greater than maxEmployees");
  }

  return queryAttributes;
}

/** TODO: write docstring */

function validateJobSearchQuery(queryAttributes) {

  if (queryAttributes.minSalary) {
    queryAttributes.minSalary = Number(queryAttributes.minSalary);
  }
  if (queryAttributes.hasEquity) {
    if (queryAttributes.hasEquity != "true" && queryAttributes.hasEquity != "false") {
      throw new BadRequestError("hasEquity must be true or false");
    }
    queryAttributes.hasEquity = (queryAttributes === "true");
  }


  const result = jsonschema.validate(
    queryAttributes, jobSearchQuerySchema, { required: true });

  if (!result.valid) {
    const errs = result.errors.map(err => err.stack);
    throw new BadRequestError(errs);
  }

  return queryAttributes;


}

module.exports = {
  validateCompanySearchQuery,
  validateJobSearchQuery
};