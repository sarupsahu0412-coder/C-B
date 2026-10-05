import { resolveRate } from "./src/utils/rateResolver.js";

const employeeContext = {
  GradeID: 1,
  EmploymentTypeID: 1,
  LocationID: 3,
  DesignationID: 6,
};

const rates = [
  {
    ComponentRateID: 101,
    ComponentID: 21,
    ComponentRuleID: 21,
    GradeID: 1,
    EmploymentTypeID: null,
    LocationID: null,
    DesignationID: null,
    RateValue: 5000,
  },
  {
    ComponentRateID: 102,
    ComponentID: 21,
    ComponentRuleID: 21,
    GradeID: 1,
    EmploymentTypeID: 1,
    LocationID: 3,
    DesignationID: 6,
    RateValue: 6500,
  },
];

const result = resolveRate(
  rates,
  21,
  21,
  employeeContext
);

console.log("Resolved Rate:");
console.log(result);