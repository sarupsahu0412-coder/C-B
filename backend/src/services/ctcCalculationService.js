import {
  getEmployeeSalaryContext,
  getSalaryComponentConfigurations,
  getCTCCalculationById,
  getCTCCalculationsByEmployee,
} from "../repositories/ctcCalculationRepository.js";

import {
  resolveRate,
} from "../utils/rateResolver.js";

import {
  evaluateAllEligibility,
} from "../utils/eligibilityEvaluator.js";

import {
  calculateAllComponents,
} from "../utils/ctcCalculationEngine.js";


/**
 * ============================================================
 * GET EMPLOYEE SALARY CONTEXT
 * ============================================================
 */

export const getEmployeeSalaryContextService = async (
  employeeId,
  effectiveDate
) => {
  if (!employeeId) {
    throw new Error("Employee ID is required");
  }

  if (!effectiveDate) {
    throw new Error("Effective date is required");
  }

  const employeeContext = await getEmployeeSalaryContext(
    employeeId,
    effectiveDate
  );

  if (!employeeContext) {
    throw new Error(
      `Employee ${employeeId} salary context not found`
    );
  }

  return employeeContext;
};


/**
 * ============================================================
 * GET SALARY COMPONENT CONFIGURATION
 * ============================================================
 */

export const getSalaryComponentConfigurationsService = async (
  employeeId,
  effectiveDate,
  options = {}
) => {
  if (!employeeId) {
    throw new Error("Employee ID is required");
  }

  if (!effectiveDate) {
    throw new Error("Effective date is required");
  }

  const configuration =
    await getSalaryComponentConfigurations(
      employeeId,
      effectiveDate
    );

  if (!configuration) {
    throw new Error(
      `Salary configuration not found for employee ${employeeId}`
    );
  }

  console.log(
    "DEBUG EMPLOYEE CONTEXT:",
    configuration.employee
  );

  const employeeContext = {
  ...configuration.employee,

  attributes: {
    ...(configuration.employee.attributes || {}),

    COMPANY_CAR:
      options.vehicleOption?.companyCar || null,

    CAR_TYPE:
      options.vehicleOption?.carType || null,
  },
};

console.log(
  "DEBUG RUNTIME EMPLOYEE CONTEXT:",
  employeeContext
);

  /**
   * ----------------------------------------------------------
   * Evaluate eligibility
   * ----------------------------------------------------------
   */

  const eligibilityResults = evaluateAllEligibility(
  configuration.eligibility || [],
  configuration.conditions || [],
  employeeContext,
  {
    accommodation: options.accommodation || {},
    vehicleOption: options.vehicleOption || {},
  }
);

console.log("ACCOMMODATION OPTIONS:", options.accommodation);

console.log(
  "ELIGIBILITY RESULTS:",
  JSON.stringify(eligibilityResults, null, 2)
);

  /**
   * ----------------------------------------------------------
   * Resolve rules + rates
   * ----------------------------------------------------------
   */

  const resolvedComponents =
    (configuration.components || []).map((component) => {
      const componentId = Number(
        component.ComponentID ??
        component.componentId
      );

      const componentEligibility =
  eligibilityResults.find(
    (item) =>
      Number(item.componentId) === componentId
  );

let eligibilityStatus;

if (!componentEligibility) {
  eligibilityStatus = "Eligibility Not Configured";
} else if (componentEligibility.eligible === false) {
  eligibilityStatus = "Not Eligible";
} else {
  eligibilityStatus = "Eligible";
}

      const rules =
        (configuration.rules || []).filter(
          (rule) =>
            Number(rule.ComponentID) === componentId
        );

      /**
       * Select active rule.
       */

      const rule =
        rules.length > 0
          ? rules
              .slice()
              .sort(
                (a, b) =>
                  Number(a.Priority ?? 999) -
                  Number(b.Priority ?? 999)
              )[0]
          : null;

      /**
       * Resolve rate for selected rule.
       */

      const rate =
        rule
          ? resolveRate(
              configuration.rates || [],
              componentId,
              rule.ComponentRuleID,
              employeeContext
            )
          : null;

      return {
        ...component,
        eligibilityStatus,
        eligibility: componentEligibility || null,
        rule,
        rate,
      };
    });

  /**
   * ----------------------------------------------------------
   * Calculate components
   * ----------------------------------------------------------
   */

  const calculatedComponents =
    calculateAllComponents({
      resolvedComponents,
      basicSalary:
        Number(options.basicSalary || 0),
      options,
    });

  return {
    ...configuration,
    eligibilityResults,
    resolvedComponents,
    calculatedComponents,
  };
};


/**
 * ============================================================
 * CALCULATE CTC
 * ============================================================
 *
 * Workbook-based CTC calculation.
 *
 * Flow:
 *
 * Basic Salary
 *      ↓
 * Monthly Gross
 *      ↓
 * Retirals
 *      ↓
 * Current Annual Gross + Retirals
 *      ↓
 * Annual Fixed Benefits
 *      ↓
 * Annual Fixed CTC
 *      ↓
 * Variable Pay + Other CTC Costs
 *      ↓
 * Final CTC
 *
 * ============================================================
 */

export const calculateCTCService = async (data) => {
  const {
  employeeId,
  effectiveDate,
  basicSalary,
  accommodation,
  vehicleOption,
  reimbursementInput,
  fuelOption,
} = data;


  /**
   * ==========================================================
   * 1. VALIDATE INPUT
   * ==========================================================
   */

  if (!employeeId) {
    throw new Error("Employee ID is required");
  }

  if (!effectiveDate) {
    throw new Error("Effective date is required");
  }

  if (
    basicSalary === undefined ||
    basicSalary === null ||
    basicSalary === ""
  ) {
    throw new Error("Basic salary is required");
  }

  const enteredBasicSalary = Number(basicSalary);

  if (
    Number.isNaN(enteredBasicSalary) ||
    enteredBasicSalary <= 0
  ) {
    throw new Error(
      "Basic salary must be greater than zero"
    );
  }


  /**
   * ==========================================================
   * 2. GET EMPLOYEE SALARY CONTEXT
   * ==========================================================
   */

  const employeeContext =
    await getEmployeeSalaryContextService(
      employeeId,
      effectiveDate
    );


  /**
   * ==========================================================
   * 3. VALIDATE BASIC SALARY AGAINST GRADE/LEVEL
   * ==========================================================
   */

  const minimumSalary =
    Number(employeeContext.MinSalary || 0);

  const maximumSalary =
    Number(employeeContext.MaxSalary || 0);


  if (
    minimumSalary > 0 &&
    enteredBasicSalary < minimumSalary
  ) {
    throw new Error(
      `Basic salary ${enteredBasicSalary} is below the minimum salary ${minimumSalary}`
    );
  }


  if (
    maximumSalary > 0 &&
    enteredBasicSalary > maximumSalary
  ) {
    throw new Error(
      `Basic salary ${enteredBasicSalary} is above the maximum salary ${maximumSalary}`
    );
  }


  /**
   * ==========================================================
   * 4. GET SALARY COMPONENT CONFIGURATION
   * ==========================================================
   */

  const configuration =
  await getSalaryComponentConfigurationsService(
    employeeId,
    effectiveDate,
    {
      basicSalary: enteredBasicSalary,
      accommodation,
      vehicleOption,
      reimbursementInput,
      fuelOption,
    }
  );


  const calculatedComponents =
    configuration.calculatedComponents || [];


  /**
   * ==========================================================
   * 5. REMOVE NOT-ELIGIBLE COMPONENTS
   * ==========================================================
   */

  const validComponents =
    calculatedComponents.filter(
      (component) =>
        component &&
        component.eligibilityStatus !==
          "Not Eligible"
    );


  /**
   * ==========================================================
   * HELPER
   * ==========================================================
   */

  const getComponentCode = (component) => {
    return String(
      component?.componentCode ??
      component?.ComponentCode ??
      ""
    )
      .trim()
      .toUpperCase();
  };


  /**
   * ==========================================================
   * 6. MONTHLY GROSS
   * ==========================================================
   */

  const monthlyGrossCodes = new Set([
    "BASIC",
    "SUPP_ALLOWANCE",
    "HRA",
    "HHA",
    "CCA",
    "PERSONAL_ALLOWANCE",
    "SPECIAL_ALLOWANCE",
    "UTILITY_ALLOWANCE",
    "METRO_ALLOWANCE",
    "PLANTATION_ALLOWANCE",
    "CONVEYANCE",
    "EV_ALLOWANCE",
    "VEHICLE_ALLOWANCE",
    "VHNC",
  ]);


  const monthlyGrossComponents =
    validComponents.filter(
      (component) =>
        monthlyGrossCodes.has(
          getComponentCode(component)
        )
    );


  const monthlyGross =
    monthlyGrossComponents.reduce(
      (total, component) =>
        total +
        Number(
          component.monthlyAmount || 0
        ),
      0
    );


  /**
   * ==========================================================
   * 7. ANNUAL MONTHLY GROSS
   * ==========================================================
   */

  const annualMonthlyGross =
    monthlyGrossComponents.reduce(
      (total, component) =>
        total +
        Number(
          component.annualizedAmount || 0
        ),
      0
    );


  /**
   * ==========================================================
   * 8. RETIRALS
   * ==========================================================
   *
   * Workbook formula:
   *
   * Retiral = Monthly Gross × Retiral %
   *
   * ==========================================================
   */

  const retiralsComponent =
    validComponents.find(
      (component) =>
        getComponentCode(component) ===
        "RETIRALS"
    );


  const retiralsPercentage =
    Number(
      retiralsComponent?.rate?.RateValue ??
      retiralsComponent?.rate?.rateValue ??
      retiralsComponent?.rule?.PercentageValue ??
      retiralsComponent?.rule?.percentageValue ??
      0
    );


const monthlyRetirals =
  Number(retiralsComponent?.monthlyAmount || 0);

const annualRetirals =
  Number(retiralsComponent?.annualizedAmount || 0);


  /**
   * ==========================================================
   * 9. CURRENT MONTHLY GROSS + RETIRALS
   * ==========================================================
   */

  const currentMonthlyGrossPlusRetirals =
    monthlyGross +
    monthlyRetirals;


  const currentAnnualGrossPlusRetirals =
    annualMonthlyGross +
    annualRetirals;


  /**
   * ==========================================================
   * 10. ANNUAL FIXED BENEFITS
   * ==========================================================
   */

  const annualFixedBenefitCodes = new Set([
    "LTA",
    "SAMPLING",
    "MEDICAL",
  ]);


  const annualFixedBenefits =
    validComponents
      .filter(
        (component) =>
          annualFixedBenefitCodes.has(
            getComponentCode(component)
          )
      )
      .reduce(
        (total, component) =>
          total +
          Number(
            component.annualizedAmount || 0
          ),
        0
      );


  /**
   * ==========================================================
   * 11. ANNUAL FIXED CTC
   * ==========================================================
   */

  const annualFixed =
    currentAnnualGrossPlusRetirals +
    annualFixedBenefits;


  /**
   * ==========================================================
   * 12. VARIABLE PAY / APB
   * ==========================================================
   */

  const variablePayCodes = new Set([
    "VARIABLE_PAY",
    "APB",
  ]);


  const annualVariablePay =
    validComponents
      .filter(
        (component) =>
          variablePayCodes.has(
            getComponentCode(component)
          )
      )
      .reduce(
        (total, component) =>
          total +
          Number(
            component.annualizedAmount || 0
          ),
        0
      );


  /**
   * ==========================================================
   * 13. OTHER FINAL CTC COMPONENTS
   * ==========================================================
   */

  const otherFinalCTCCodes = new Set([
    "BRLI",
    "COA_COL",
    "ACCOMMODATION_RENT",
    "ACCOMMODATION_MAINTENANCE",
    "DRIVER_WAGES",
    "FUEL_REIMBURSEMENT",
    "MOBILE_REIMBURSEMENT",
  ]);


  const otherFinalCTC =
    validComponents
      .filter(
        (component) =>
          otherFinalCTCCodes.has(
            getComponentCode(component)
          )
      )
      .reduce(
        (total, component) =>
          total +
          Number(
            component.annualizedAmount || 0
          ),
        0
      );


  /**
   * ==========================================================
   * 14. FINAL CTC
   * ==========================================================
   */

  const annualCTC =
  currentAnnualGrossPlusRetirals +
  annualFixedBenefits +
  annualVariablePay +
  otherFinalCTC;


  /**
   * ==========================================================
   * 15. MONTHLY CTC EQUIVALENT
   * ==========================================================
   */

  const monthlyCTC =
    annualCTC / 12;


  /**
   * ==========================================================
   * 16. FIXED CTC IN LAKHS
   * ==========================================================
   */

  const fixedCTCInLakhs =
    annualFixed / 100000;


  /**
   * ==========================================================
   * 17. FINAL CTC IN LAKHS
   * ==========================================================
   */

  const finalCTCInLakhs =
    annualCTC / 100000;


  /**
   * ==========================================================
   * 18. MONTHLY DEDUCTIONS
   * ==========================================================
   */

  const monthlyDeductions =
    validComponents
      .filter(
        (component) =>
          component.isDeduction === true &&
          component.calculationFrequency ===
            "Monthly"
      )
      .reduce(
        (total, component) =>
          total +
          Number(
            component.monthlyAmount || 0
          ),
        0
      );


  /**
   * ==========================================================
   * 19. ANNUAL DEDUCTIONS
   * ==========================================================
   */

  const annualDeductions =
    validComponents
      .filter(
        (component) =>
          component.isDeduction === true
      )
      .reduce(
        (total, component) =>
          total +
          Number(
            component.annualizedAmount || 0
          ),
        0
      );


  /**
   * ==========================================================
   * 20. NET MONTHLY PAY
   * ==========================================================
   */

  const netMonthlyPay =
    monthlyGross -
    monthlyDeductions;


  /**
   * ==========================================================
   * 21. FINAL RESPONSE
   * ==========================================================
   */

  return {
    employeeId: Number(employeeId),

    effectiveDate,

    employee: {
      employeeId:
        employeeContext.EmployeeID,

      employeeCode:
        employeeContext.EmployeeCode,

      employeeName:
        employeeContext.EmployeeName,

      grade:
        employeeContext.GradeCode,

      gradeName:
        employeeContext.GradeName,

      level:
        employeeContext.LevelID,

      designationId:
        employeeContext.DesignationID,

      employmentTypeId:
        employeeContext.EmploymentTypeID,

      locationId:
        employeeContext.LocationID,
    },

    salary: {
      basicSalary:
        enteredBasicSalary,

      minimumSalary,

      maximumSalary,
    },

    components:
      calculatedComponents,

    totals: {
      monthlyGross,

      annualMonthlyGross,

      retiralsPercentage,

      monthlyRetirals,

      annualRetirals,

      currentMonthlyGrossPlusRetirals,

      currentAnnualGrossPlusRetirals,

      annualFixedBenefits,

      annualFixed,

      annualVariablePay,

      otherFinalCTC,

      annualCTC,

      monthlyCTC,

      fixedCTCInLakhs,

      finalCTCInLakhs,

      monthlyDeductions,

      annualDeductions,

      netMonthlyPay,
    },

    status:
      "CALCULATED",

    message:
      "CTC calculated successfully",
  };
};


/**
 * ============================================================
 * GET CTC BY ID
 * ============================================================
 */

export const getCTCByIdService = async (id) => {
  if (!id) {
    throw new Error("CTC ID is required");
  }

  const result =
    await getCTCById(id);

  if (!result) {
    throw new Error(
      `CTC record ${id} not found`
    );
  }

  return result;
};


/**
 * ============================================================
 * GET CTC BY EMPLOYEE
 * ============================================================
 */

export const getCTCByEmployeeService = async (
  employeeId
) => {
  if (!employeeId) {
    throw new Error("Employee ID is required");
  }

  const result =
    await getCTCByEmployee(employeeId);

  return result || [];
};