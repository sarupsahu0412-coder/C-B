import { sql, getPool } from "../config/db.js";

/**
 * Get employee + grade + level + salary + compensation attributes context
 */
export const getEmployeeSalaryContext = async (
  employeeId,
  effectiveDate
) => {
  const pool = await getPool();

  // ---------------------------------------------------------
  // 1. Get employee + grade + level + salary context
  // ---------------------------------------------------------
  const result = await pool
    .request()
    .input("EmployeeID", sql.Int, employeeId)
    .input("EffectiveDate", sql.Date, effectiveDate)
    .query(`
      SELECT TOP 1
          e.EmployeeID,
          e.EmployeeCode,
          CONCAT(e.FirstName, ' ', e.LastName) AS EmployeeName,

          e.Grade,
          e.Level,
          e.LocationID,
          e.DepartmentID,
          e.DesignationID,
          e.EmploymentTypeID,
          e.CompanyPension,
          e.PensionType,

          g.GradeID,
          g.GradeCode,
          g.GradeName,

          l.LevelID,
          l.LevelCode,
          l.LevelName,

          g.MinSalary,
          g.MaxSalary,

          es.EmployeeSalaryID,
          es.SalaryRevisionNumber,
          es.EffectiveFrom,
          es.EffectiveTo,
          es.SalaryStatus,
          es.CurrencyCode,
          es.BasicSalary,
          es.AnnualCTC,
          es.MonthlyCTC

      FROM Employees e

      INNER JOIN Grades g
          ON g.GradeCode = e.Grade

      LEFT JOIN Levels l
          ON l.LevelCode = e.Level

      LEFT JOIN EmployeeSalary es
          ON es.EmployeeID = e.EmployeeID
          AND es.EffectiveFrom <= @EffectiveDate
          AND (
              es.EffectiveTo IS NULL
              OR es.EffectiveTo >= @EffectiveDate
          )

      WHERE e.EmployeeID = @EmployeeID

      ORDER BY
          es.EffectiveFrom DESC,
          es.SalaryRevisionNumber DESC;
    `);

  const employeeContext = result.recordset[0];

  // Employee not found
  if (!employeeContext) {
    return null;
  }

  // ---------------------------------------------------------
  // 2. Get active employee compensation attributes
  // ---------------------------------------------------------
  const attributeResult = await pool
    .request()
    .input("EmployeeID", sql.Int, employeeId)
    .input("EffectiveDate", sql.Date, effectiveDate)
    .query(`
      SELECT
          EmployeeCompensationAttributeID,
          AttributeCode,
          AttributeValue,
          EffectiveFrom,
          EffectiveTo,
          IsActive,
          Remarks
      FROM EmployeeCompensationAttributes
      WHERE EmployeeID = @EmployeeID
        AND IsActive = 1
        AND EffectiveFrom <= @EffectiveDate
        AND (
            EffectiveTo IS NULL
            OR EffectiveTo >= @EffectiveDate
        )
      ORDER BY
          EffectiveFrom DESC,
          EmployeeCompensationAttributeID DESC;
    `);

  // ---------------------------------------------------------
  // 3. Convert attribute rows into an attribute object
  // ---------------------------------------------------------
  const attributes = {};

  for (const attribute of attributeResult.recordset) {
    // Keep the latest effective value for each AttributeCode
    if (!Object.prototype.hasOwnProperty.call(
      attributes,
      attribute.AttributeCode
    )) {
      attributes[attribute.AttributeCode] =
        attribute.AttributeValue;
    }
  }

  // ---------------------------------------------------------
  // 4. Return complete employee context
  // ---------------------------------------------------------
  return {
    ...employeeContext,
    attributes,
  };
};

/**
 * Get one saved CTC calculation
 */
export const getCTCCalculationById = async (id) => {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("CTCCalculationID", sql.Int, id)
    .query(`
      SELECT
          c.CTCCalculationID,
          c.EmployeeID,
          c.EmployeeSalaryID,
          c.CalculationDate,
          c.EffectiveFrom,
          c.BasicSalary,
          c.HRA,
          c.DA,
          c.Allowances,
          c.VariablePay,
          c.Bonus,
          c.EmployerPF,
          c.Gratuity,
          c.OtherBenefits,
          c.MonthlyCTC,
          c.AnnualCTC,
          c.Status,
          c.CreatedAt,
          c.UpdatedAt

      FROM CTCCalculations c

      WHERE c.CTCCalculationID = @CTCCalculationID;
    `);

  const calculation = result.recordset[0];

  if (!calculation) {
    return null;
  }

  const componentsResult = await pool
    .request()
    .input("CTCCalculationID", sql.Int, id)
    .query(`
      SELECT
          cc.CTCCalculationComponentID,
          cc.CTCCalculationID,
          cc.ComponentID,
          sc.ComponentCode,
          sc.ComponentName,
          cc.ComponentRuleID,
          cc.CalculationFrequency,
          cc.BaseFrequency,
          cc.BaseAmount,
          cc.PercentageValue,
          cc.CalculatedAmount,
          cc.AnnualizedAmount

      FROM CTCCalculationComponents cc

      INNER JOIN SalaryComponents sc
          ON sc.ComponentID = cc.ComponentID

      WHERE cc.CTCCalculationID = @CTCCalculationID

      ORDER BY cc.CTCCalculationComponentID;
    `);

  return {
    ...calculation,
    components: componentsResult.recordset,
  };
};

/**
 * Get CTC calculation history for an employee
 */
export const getCTCCalculationsByEmployee = async (employeeId) => {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("EmployeeID", sql.Int, employeeId)
    .query(`
      SELECT
          c.CTCCalculationID,
          c.EmployeeID,
          c.EmployeeSalaryID,
          c.CalculationDate,
          c.EffectiveFrom,
          c.BasicSalary,
          c.MonthlyCTC,
          c.AnnualCTC,
          c.Status,
          c.CreatedAt

      FROM CTCCalculations c

      WHERE c.EmployeeID = @EmployeeID

      ORDER BY
          c.CalculationDate DESC,
          c.CTCCalculationID DESC;
    `);

  return result.recordset;
};

/**
 * Get salary component configuration for an employee
 */
export const getSalaryComponentConfigurations = async (
  employeeId,
  effectiveDate
) => {
  const pool = await getPool();

  // --------------------------------------------------
  // 1. Get employee context
  // --------------------------------------------------

  const employeeContext = await getEmployeeSalaryContext(
    employeeId,
    effectiveDate
  );

  if (!employeeContext) {
  return null;
}

// --------------------------------------------------
// 1A. Get employee compensation attributes
// --------------------------------------------------

const attributesResult = await pool
  .request()
  .input("EmployeeID", sql.Int, employeeId)
  .input("EffectiveDate", sql.Date, effectiveDate)
  .query(`
    SELECT
      AttributeCode,
      AttributeValue
    FROM EmployeeCompensationAttributes
    WHERE EmployeeID = @EmployeeID
      AND IsActive = 1
      AND EffectiveFrom <= @EffectiveDate
      AND (
        EffectiveTo IS NULL
        OR EffectiveTo >= @EffectiveDate
      )
  `);

const attributes = {};

for (const row of attributesResult.recordset) {
  attributes[row.AttributeCode] = row.AttributeValue;
}

employeeContext.attributes = attributes;


  // --------------------------------------------------
  // 2. Get active salary components
  // --------------------------------------------------

  const componentsResult = await pool
    .request()
    .input("EffectiveDate", sql.Date, effectiveDate)
    .query(`
      SELECT
          ComponentID,
          ComponentCode,
          ComponentName,
          ComponentType,
          CalculationType,
          IsEarning,
          IsDeduction,
          IsEmployerCost,
          IsTaxable,
          IsActive
      FROM SalaryComponents
      WHERE IsActive = 1
      ORDER BY ComponentID;
    `);

  // --------------------------------------------------
  // 3. Get active rules
  // --------------------------------------------------

  const rulesResult = await pool
    .request()
    .input("EffectiveDate", sql.Date, effectiveDate)
    .query(`
      SELECT
          ComponentRuleID,
          ComponentID,
          RuleName,
          CalculationType,
          PercentageValue,
          BaseComponentID,
          FixedAmount,
          FormulaExpression,
          MinimumAmount,
          MaximumAmount,
          EffectiveFrom,
          EffectiveTo,
          CalculationFrequency,
          BaseFrequency,
          CalculationBase,
          RuleCode,
          RuleDescription,
          RulePriority
      FROM SalaryComponentRules
      WHERE IsActive = 1
        AND EffectiveFrom <= @EffectiveDate
        AND (
            EffectiveTo IS NULL
            OR EffectiveTo >= @EffectiveDate
        )
      ORDER BY
          ComponentID,
          RulePriority,
          ComponentRuleID;
    `);

  // --------------------------------------------------
  // 4. Get applicable rates
  // --------------------------------------------------

  const ratesResult = await pool
    .request()
    .input("EffectiveDate", sql.Date, effectiveDate)
    .input("GradeID", sql.Int, employeeContext.GradeID)
    .input("EmploymentTypeID", sql.Int, employeeContext.EmploymentTypeID)
    .input("LocationID", sql.Int, employeeContext.LocationID)
    .input("DesignationID", sql.Int, employeeContext.DesignationID)
    .query(`
      SELECT
    ComponentRateID,
    ComponentID,
    RateCode,
    RateName,
    RateType,
    GradeID,
    EmploymentTypeID,
    LocationID,
    DesignationID,
    RateValue,
    SecondaryRateValue,
    Unit,
    EffectiveFrom,
    EffectiveTo,
    IsActive,
    Remarks,
    CreatedAt,
    UpdatedAt,
    ComponentRuleID,
    LevelMin,
    LevelMax,
    AttributeCode,
    AttributeValue
FROM SalaryComponentRates
      WHERE IsActive = 1
        AND EffectiveFrom <= @EffectiveDate
        AND (
            EffectiveTo IS NULL
            OR EffectiveTo >= @EffectiveDate
        )
        AND (GradeID IS NULL OR GradeID = @GradeID)
        AND (
            EmploymentTypeID IS NULL
            OR EmploymentTypeID = @EmploymentTypeID
        )
        AND (
            LocationID IS NULL
            OR LocationID = @LocationID
        )
        AND (
            DesignationID IS NULL
            OR DesignationID = @DesignationID
        )
      ORDER BY
          ComponentID,
          ComponentRateID;
    `);

  // --------------------------------------------------
  // 5. Get eligibility definitions
  // --------------------------------------------------

  const eligibilityResult = await pool
    .request()
    .input("EffectiveDate", sql.Date, effectiveDate)
    .query(`
      SELECT
          ComponentEligibilityID,
          ComponentID,
          EligibilityCode,
          EligibilityName,
          EligibilityType,
          EffectiveFrom,
          EffectiveTo,
          Remarks
      FROM SalaryComponentEligibility
      WHERE IsActive = 1
        AND EffectiveFrom <= @EffectiveDate
        AND (
            EffectiveTo IS NULL
            OR EffectiveTo >= @EffectiveDate
        )
      ORDER BY
          ComponentID,
          ComponentEligibilityID;
    `);

  // --------------------------------------------------
  // 6. Get eligibility conditions
  // --------------------------------------------------

  const conditionsResult = await pool
    .request()
    .input("EffectiveDate", sql.Date, effectiveDate)
    .query(`
      SELECT
          EligibilityConditionID,
          ComponentEligibilityID,
          ConditionGroup,
          ConditionType,
          Operator,
          ValueText,
          GradeID,
          LevelID,
          EmploymentTypeID,
          LocationID,
          DesignationID,
          AttributeCode,
          EffectiveFrom,
          EffectiveTo,
          Remarks
      FROM SalaryComponentEligibilityConditions
      WHERE IsActive = 1
        AND EffectiveFrom <= @EffectiveDate
        AND (
            EffectiveTo IS NULL
            OR EffectiveTo >= @EffectiveDate
        )
      ORDER BY
          ComponentEligibilityID,
          ConditionGroup,
          EligibilityConditionID;
    `);

  return {
    employee: employeeContext,
    components: componentsResult.recordset,
    rules: rulesResult.recordset,
    rates: ratesResult.recordset,
    eligibility: eligibilityResult.recordset,
    conditions: conditionsResult.recordset,
  };
};