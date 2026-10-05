import {
  calculateAllComponents,
} from "./src/utils/ctcCalculationEngine.js";


/*
 * ============================================================
 * CTC CALCULATION ENGINE TEST
 * ============================================================
 */

const basicSalary = 50000;


/*
 * ============================================================
 * RESOLVED COMPONENTS
 * ============================================================
 *
 * IMPORTANT:
 *
 * calculateAllComponents() expects each item directly in
 * resolvedComponents to contain:
 *
 * ComponentID
 * ComponentCode
 * ComponentName
 * rule
 * rate
 *
 * NOT:
 *
 * component: {}
 * rules: []
 * eligibility: {}
 *
 * The service layer is responsible for resolving those
 * objects before passing them to the calculation engine.
 * ============================================================
 */

const resolvedComponents = [

  /*
   * ----------------------------------------------------------
   * BASIC
   * ----------------------------------------------------------
   */

  {
    ComponentID: 10,
    ComponentCode: "BASIC",
    ComponentName: "Basic",
    ComponentType: "Salary",

    isEarning: true,
    isDeduction: false,
    isEmployerCost: false,
    isTaxable: true,

    eligible: true,
    eligibilityStatus: "Eligible",

    calculationType: "Input",
    calculationFrequency: "Monthly",
    baseFrequency: "Monthly",

    rule: null,
    rate: null,
  },


  /*
   * ----------------------------------------------------------
   * LTA
   * ----------------------------------------------------------
   */

  {
    ComponentID: 24,
    ComponentCode: "LTA",
    ComponentName: "LTA",
    ComponentType: "Benefit",

    isEarning: true,
    isDeduction: false,
    isEmployerCost: false,
    isTaxable: true,

    eligible: true,
    eligibilityStatus: "Eligible",

    calculationType: "Fixed",
    calculationFrequency: "Annual",
    baseFrequency: "Annual",

    rule: {
      ComponentRuleID: 24,
      ComponentID: 24,
      RuleName: "LTA - Fixed Annual",
      CalculationType: "Fixed",
      PercentageValue: null,
      BaseComponentID: null,
      CalculationFrequency: "Annual",
      BaseFrequency: "Annual",
    },

    rate: {
      ComponentRateID: 101,
      ComponentID: 24,
      ComponentRuleID: 24,
      RateValue: 41500,
      Unit: "Annual",
    },
  },


  /*
   * ----------------------------------------------------------
   * PERSONAL ALLOWANCE
   * ----------------------------------------------------------
   */

  {
    ComponentID: 15,
    ComponentCode: "PERSONAL_ALLOWANCE",
    ComponentName: "Personal Allowance",
    ComponentType: "Allowance",

    isEarning: true,
    isDeduction: false,
    isEmployerCost: false,
    isTaxable: true,

    eligible: true,
    eligibilityStatus: "Eligible",

    calculationType: "Percentage",
    calculationFrequency: "Monthly",
    baseFrequency: "Monthly",

    rule: {
      ComponentRuleID: 15,
      ComponentID: 15,
      RuleName: "Personal Allowance - 3% of Salary",
      CalculationType: "Percentage",
      PercentageValue: 3,
      BaseComponentID: null,
      CalculationFrequency: "Monthly",
      BaseFrequency: "Monthly",
    },

    rate: null,
  },


  /*
   * ----------------------------------------------------------
   * MOBILE REIMBURSEMENT
   * ----------------------------------------------------------
   */

  {
    ComponentID: 35,
    ComponentCode: "MOBILE_REIMBURSEMENT",
    ComponentName: "Mobile Reimbursement",
    ComponentType: "Benefit",

    isEarning: true,
    isDeduction: false,
    isEmployerCost: true,
    isTaxable: false,

    eligible: true,
    eligibilityStatus: "Eligible",

    calculationType: "Fixed",
    calculationFrequency: "Monthly",
    baseFrequency: "Monthly",

    rule: {
      ComponentRuleID: 32,
      ComponentID: 35,
      RuleName: "Mobile Reimbursement - Eligibility Based",
      CalculationType: "Fixed",
      PercentageValue: null,
      BaseComponentID: null,
      CalculationFrequency: "Monthly",
      BaseFrequency: "Monthly",
    },

    rate: {
      ComponentRateID: 122,
      ComponentID: 35,
      ComponentRuleID: 32,
      RateValue: 299,
      Unit: "Monthly",
    },
  },


  /*
   * ----------------------------------------------------------
   * SPECIAL ALLOWANCE
   * ----------------------------------------------------------
   */

  {
    ComponentID: 16,
    ComponentCode: "SPECIAL_ALLOWANCE",
    ComponentName: "Special Allowance",
    ComponentType: "Allowance",

    isEarning: true,
    isDeduction: false,
    isEmployerCost: false,
    isTaxable: true,

    eligible: true,
    eligibilityStatus: "Eligible",

    calculationType: "Fixed",
    calculationFrequency: "Monthly",
    baseFrequency: "Monthly",

    rule: {
      ComponentRuleID: 16,
      ComponentID: 16,
      RuleName: "Special Allowance - Grade/Level Based",
      CalculationType: "Fixed",
      PercentageValue: null,
      BaseComponentID: null,
      CalculationFrequency: "Monthly",
      BaseFrequency: "Monthly",
    },

    rate: {
      ComponentRateID: 97,
      ComponentID: 16,
      ComponentRuleID: 16,
      RateValue: 12000,
      Unit: "Monthly",
    },
  },


  /*
   * ----------------------------------------------------------
   * EV ALLOWANCE
   * ----------------------------------------------------------
   *
   * Testing NOT ELIGIBLE component.
   * ----------------------------------------------------------
   */

  {
    ComponentID: 21,
    ComponentCode: "EV_ALLOWANCE",
    ComponentName: "EV Allowance",
    ComponentType: "Allowance",

    isEarning: true,
    isDeduction: false,
    isEmployerCost: false,
    isTaxable: true,

    eligible: false,
    eligibilityStatus: "Not Eligible",

    calculationType: "Fixed",
    calculationFrequency: "Monthly",
    baseFrequency: "Monthly",

    rule: {
      ComponentRuleID: 21,
      ComponentID: 21,
      RuleName: "EV Allowance",
      CalculationType: "Fixed",
      PercentageValue: null,
      BaseComponentID: null,
      CalculationFrequency: "Monthly",
      BaseFrequency: "Monthly",
    },

    rate: {
      ComponentRateID: 100,
      ComponentID: 21,
      ComponentRuleID: 21,
      RateValue: 5000,
      Unit: "Monthly",
    },

    reason: "Eligibility conditions not satisfied",
  },

    // TEST FIXTURE ONLY — HRA
  {
    ComponentID: 9001,
    ComponentCode: "HRA",
    ComponentName: "HRA",
    ComponentType: "Allowance",
    isEarning: true,
    isDeduction: false,
    isEmployerCost: false,
    isTaxable: true,

    eligible: true,
    eligibilityStatus: "Eligible",

    calculationType: "Fixed",
    calculationFrequency: "Monthly",
    baseFrequency: "Monthly",

    rule: {
      ComponentRuleID: 9001,
      ComponentID: 9001,
      RuleName: "HRA test fixture",
      CalculationType: "Fixed",
      CalculationFrequency: "Monthly",
      BaseFrequency: "Monthly",
      FixedAmount: 1000,
    },

    rate: null,
  },

  // TEST FIXTURE ONLY — HHA
  {
    ComponentID: 9002,
    ComponentCode: "HHA",
    ComponentName: "HHA",
    ComponentType: "Allowance",
    isEarning: true,
    isDeduction: false,
    isEmployerCost: false,
    isTaxable: true,

    eligible: true,
    eligibilityStatus: "Eligible",

    calculationType: "Fixed",
    calculationFrequency: "Monthly",
    baseFrequency: "Monthly",

    rule: {
      ComponentRuleID: 9002,
      ComponentID: 9002,
      RuleName: "HHA test fixture",
      CalculationType: "Fixed",
      CalculationFrequency: "Monthly",
      BaseFrequency: "Monthly",
      FixedAmount: 500,
    },

    rate: null,
  },

];


 /*
  * ===========================================================
  * RUN ENGINE
  * ===========================================================
  */

const accommodationScenarios = [
  {
    name: "No company accommodation",
    accommodation: {
      companyAccommodation: "No",
      accommodationType: "",
    },
    expectedHRA: 1000,
    expectedHHA: 0,
  },
  {
    name: "Company accommodation - CLA",
    accommodation: {
      companyAccommodation: "Yes",
      accommodationType: "CLA",
    },
    expectedHRA: 0,
    expectedHHA: 0,
  },
  {
    name: "Company accommodation - COL",
    accommodation: {
      companyAccommodation: "Yes",
      accommodationType: "COL",
    },
    expectedHRA: 0,
    expectedHHA: 0,
  },
  {
    name: "Company accommodation - Hostel",
    accommodation: {
      companyAccommodation: "Yes",
      accommodationType: "Hostel",
    },
    expectedHRA: 0,
    expectedHHA: 500,
  },
];

for (const scenario of accommodationScenarios) {
  const result = calculateAllComponents({
    resolvedComponents,
    basicSalary,
    options: {
      CAR_TYPE: "EV",
      accommodation: scenario.accommodation,
    },
  });

  const hra = result.find(
    (component) => component.componentCode === "HRA"
  );

  const hha = result.find(
    (component) => component.componentCode === "HHA"
  );

  const actualHRA = hra?.monthlyAmount ?? null;
  const actualHHA = hha?.monthlyAmount ?? null;

  const passed =
    actualHRA === scenario.expectedHRA &&
    actualHHA === scenario.expectedHHA;

  console.log(`\n===== ${scenario.name} =====`);
  console.log(`HRA: ₹${actualHRA}`);
  console.log(`HHA: ₹${actualHHA}`);
  console.log(`Expected HRA: ₹${scenario.expectedHRA}`);
  console.log(`Expected HHA: ₹${scenario.expectedHHA}`);
  console.log(passed ? "PASS" : "FAIL");
}


/*
 * ============================================================
 * DISPLAY RESULT
 * ============================================================
 */



/*
 * ============================================================
 * SUMMARY
 * ============================================================
 */

