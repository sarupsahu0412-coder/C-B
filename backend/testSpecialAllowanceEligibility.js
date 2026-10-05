import { evaluateEligibility } from "./src/utils/eligibilityEvaluator.js";
import { resolveRate } from "./src/utils/rateResolver.js";
import { calculateAllComponents } from "./src/utils/ctcCalculationEngine.js";

const eligibility = {
  ComponentEligibilityID: 13,
  ComponentID: 16,
  EligibilityCode: "SPECIAL_ALLOWANCE_ELIGIBILITY",
  EligibilityType: "Conditional",
};

const conditions = [
  {
    EligibilityConditionID: 27,
    ComponentEligibilityID: 13,
    ConditionGroup: 1,
    ConditionType: "EmploymentType",
    Operator: "=",
    ValueText: "6",
    EmploymentTypeID: 6,
    DesignationID: 6,
  },
  {
    EligibilityConditionID: 28,
    ComponentEligibilityID: 13,
    ConditionGroup: 2,
    ConditionType: "EmploymentType",
    Operator: "=",
    ValueText: "7",
    EmploymentTypeID: 7,
    DesignationID: 6,
  },
];

const rates = [
  {
    ComponentRateID: 97,
    ComponentID: 16,
    ComponentRuleID: 16,
    EmploymentTypeID: 6,
    DesignationID: 6,
    RateValue: 12000,
    Unit: "Monthly",
  },
  {
    ComponentRateID: 98,
    ComponentID: 16,
    ComponentRuleID: 16,
    EmploymentTypeID: 7,
    DesignationID: 6,
    RateValue: 12000,
    Unit: "Monthly",
  },
];

const rule = {
  ComponentRuleID: 16,
  ComponentID: 16,
  RuleName: "Special Allowance - Grade/Level Based",
  CalculationType: "Fixed",
  PercentageValue: null,
  BaseComponentID: null,
  CalculationFrequency: "Monthly",
  BaseFrequency: "Monthly",
};

const component = {
  ComponentID: 16,
  ComponentCode: "SPECIAL_ALLOWANCE",
  ComponentName: "Special Allowance",
};

const testCases = [
  {
    name: "FTC Manager",
    employee: {
      EmploymentTypeID: 6,
      DesignationID: 6,
      GradeID: 1,
      LevelID: 1,
      LocationID: 3,
    },
  },
  {
    name: "FTM Manager",
    employee: {
      EmploymentTypeID: 7,
      DesignationID: 6,
      GradeID: 1,
      LevelID: 1,
      LocationID: 3,
    },
  },
  {
    name: "FT Manager",
    employee: {
      EmploymentTypeID: 1,
      DesignationID: 6,
      GradeID: 1,
      LevelID: 1,
      LocationID: 3,
    },
  },
  {
    name: "FTC Non-Manager",
    employee: {
      EmploymentTypeID: 6,
      DesignationID: 1,
      GradeID: 1,
      LevelID: 1,
      LocationID: 3,
    },
  },
];

console.log("\n===== SPECIAL ALLOWANCE RULE TEST =====\n");

for (const test of testCases) {
  const eligibilityResult = evaluateEligibility(
    eligibility,
    conditions,
    test.employee
  );

  let amount = 0;
  let rate = null;

  if (eligibilityResult.eligible) {
    rate = resolveRate(
      rates,
      16,
      16,
      test.employee
    );

    const resolvedComponents = [
      {
        component,
        eligibility: eligibilityResult,
        rules: [
          {
            rule,
            rate,
          },
        ],
      },
    ];

    const calculation = calculateAllComponents({
      resolvedComponents,
      basicSalary: 25000,
    });

    amount = calculation[0]?.monthlyAmount ?? 0;
  }

  console.log(`\n${test.name}`);
  console.log("-----------------------------");
  console.log("Eligible:", eligibilityResult.eligible);
  console.log("Matched Group:", eligibilityResult.matchedGroup ?? "None");
  console.log("Rate:", rate?.RateValue ?? 0);
  console.log("Monthly Amount:", amount);
}