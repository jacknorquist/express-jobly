"use strict";

const jsonschema = require("jsonschema");
const companiesQuerySchema = require("../schemas/companiesQuerySchema.json");
const { BadRequestError } = require("../expressError");


/** Write something here */
function validateCompanySearchQuery(queryAttributes) {

  if (queryAttributes.minEmployees) {
    queryAttributes.minEmployees = Number(queryAttributes.minEmployees)
  }
  if (queryAttributes.maxEmployees) {
    queryAttributes.maxEmployees = Number(queryAttributes.maxEmployees)
  }

  // Checks that there are no additional query parameters
  const result = jsonschema.validate(
    queryAttributes, companiesQuerySchema, { required: true });

  if (!result.valid) {
    const errs = result.errors.map(err => err.stack);
    throw new BadRequestError(errs);
  }

  const minEmp = queryAttributes.minEmployees;
  const maxEmp = queryAttributes.maxEmployees;
  if (minEmp && maxEmp && minEmp > maxEmp) {
    throw new BadRequestError("minEmployees cannot be greater than maxEmployees");
  }

  return queryAttributes;
}

module.exports = {
  validateCompanySearchQuery
}