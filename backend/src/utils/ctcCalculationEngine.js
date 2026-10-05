/**
 * ============================================================
 * CTC CALCULATION ENGINE
 * ============================================================
 *
 * This file is responsible ONLY for calculation.
 *
 * It does not:
 * - query the database
 * - evaluate employee eligibility
 * - resolve database rates
 * - save CTC
 *
 * Flow:
 *
 * Service
 *   ↓
 * Resolved Components
 *   ↓
 * Calculation Engine
 *   ↓
 * Calculated Components
 *
 * ============================================================
 */


/**
 * ============================================================
 * NUMBER HELPER
 * ============================================================
 */
export const toNumber = (value, defaultValue = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : defaultValue;
};


/**
 * ============================================================
 * FREQUENCY NORMALIZATION
 * ============================================================
 *
 * Converts an amount into a monthly amount depending on
 * the frequency on which the amount is defined.
 *
 * Monthly:
 *      25,000 → 25,000 monthly
 *
 * Annual:
 *      41,500 → 3,458.33 monthly
 *
 * Quarterly:
 *      30,000 → 10,000 monthly
 *
 * Half-Yearly:
 *      60,000 → 10,000 monthly
 *
 * ============================================================
 */
export const normalizeAmountByFrequency = (
  amount,
  frequency
) => {

  const value = toNumber(amount);

  if (!frequency) {
    return value;
  }

  const normalizedFrequency =
    String(frequency)
      .trim()
      .toLowerCase()
      .replace(/[\s_-]/g, "");


  switch (normalizedFrequency) {

    case "monthly":
      return value;

    case "annual":
    case "annually":
    case "yearly":
      return value / 12;

    case "quarterly":
      return value / 3;

    case "halfyearly":
    case "halfyear":
      return value / 6;

    case "weekly":
      return value * 52 / 12;

    case "daily":
      return value * 30;

    default:
      return value;
  }
};



/**
 * ============================================================
 * FIXED COMPONENT CALCULATION
 * ============================================================
 */
export const calculateFixedComponent = (
  rate,
  rule = null
) => {
  // Prefer a configured rate value when one exists.
  const rateAmount =
    rate?.RateValue ??
    rate?.FixedAmount ??
    rate?.rateValue ??
    rate?.fixedAmount;

  if (rateAmount !== null && rateAmount !== undefined) {
    return toNumber(rateAmount);
  }

  // Fall back to the fixed amount configured in the rule.
  const ruleAmount =
    rule?.FixedAmount ??
    rule?.fixedAmount;

  if (ruleAmount !== null && ruleAmount !== undefined) {
    return toNumber(ruleAmount);
  }

  // Neither a rate nor a rule contains a usable fixed amount.
  return 0;
};

/**
 * ============================================================
 * PERCENTAGE COMPONENT CALCULATION
 * ============================================================
 *
 * Example:
 *
 * Personal Allowance
 * PercentageValue = 3
 * BaseComponentID = 10
 *
 * Basic = ₹25,000
 *
 * Result:
 *
 * ₹25,000 × 3 / 100
 * = ₹750
 *
 * ============================================================
 */
export const calculatePercentageComponent = ({
  rule,
  rate,
  basicSalary,
  calculatedComponents = [],
}) => {
  if (!rule) {
    return 0;
  }

  // Percentage can come from the rule or
  // from the employee-specific resolved rate.
  const percentage = Number(
    rate?.RateValue ??
    rate?.rateValue ??
    rule.PercentageValue ??
    rule.percentageValue ??
    0
  );

  if (!Number.isFinite(percentage)) {
    return 0;
  }

  let baseAmount = Number(basicSalary) || 0;

  const baseComponentId =
    rule.BaseComponentID ??
    rule.baseComponentId;

  if (
    baseComponentId !== null &&
    baseComponentId !== undefined &&
    baseComponentId !== ""
  ) {
    const numericBaseComponentId =
      Number(baseComponentId);

    if (Number.isFinite(numericBaseComponentId)) {
      const baseComponent =
        calculatedComponents.find(
          (calculatedComponent) => {
            if (!calculatedComponent) {
              return false;
            }

            const calculatedComponentId =
              Number(
                calculatedComponent.componentId ??
                calculatedComponent.ComponentID
              );

            return (
              calculatedComponentId ===
              numericBaseComponentId
            );
          }
        );

      if (baseComponent) {
        baseAmount =
          Number(baseComponent.monthlyAmount) || 0;
      } else {
        baseAmount = 0;
      }
    }
  }

  return (
    baseAmount *
    percentage /
    100
  );
};

/**
 * ============================================================
 * FORMULA COMPONENT
 * ============================================================
 *
 * Formula components are intentionally not executed dynamically.
 *
 * This avoids executing arbitrary JavaScript from the database.
 *
 * Formula-based components can later have a dedicated
 * formula evaluator.
 *
 * ============================================================
 */
export const calculateFormulaComponent = ({
  rule,
  rate,
  reimbursementInput = {},
  fuelOption = "",
}) => {
  const formulaExpression = String(
    rule?.FormulaExpression ??
      rule?.formulaExpression ??
      ""
  ).trim();

  // Fuel Reimbursement
if (
  formulaExpression === "EligibleLitres * PetrolRate"
) {
  if (fuelOption !== "Yes") {
    return {
      amount: 0,
      status: "Not Opted",
      reason: "Employee did not opt for fuel reimbursement",
    };
  }

  const eligibleLitresInput =
  reimbursementInput?.fuel?.eligibleLitres;

if (
  eligibleLitresInput === "" ||
  eligibleLitresInput === null ||
  eligibleLitresInput === undefined
) {
  return {
    amount: 0,
    status: "Input Required",
    reason: "Valid eligible litres are required",
  };
}

const eligibleLitres = Number(eligibleLitresInput);

  const petrolRate = Number(
    rate?.RateValue ??
      rate?.rateValue ??
      0
  );

  if (!Number.isFinite(eligibleLitres) || eligibleLitres < 0) {
    return {
      amount: 0,
      status: "Input Required",
      reason: "Valid eligible litres are required",
    };
  }

  if (!Number.isFinite(petrolRate) || petrolRate <= 0) {
    return {
      amount: 0,
      status: "Input Required",
      reason: "Valid petrol rate is required",
    };
  }

  return {
    amount: eligibleLitres * petrolRate,
    status: "Calculated",
    reason: null,
  };
}

  return {
    amount: 0,
    status: "Unsupported Formula",
    reason: `Unsupported formula: ${
      formulaExpression || "unknown"
    }`,
  };
};


/**
 * ============================================================
 * SINGLE COMPONENT CALCULATION
 * ============================================================
 */
export const calculateComponent = ({
  component,
  rule = null,
  rate = null,
  basicSalary = 0,
  calculatedComponents = [],
  eligibilityStatus = null,
  accommodation = {},
  reimbursementInput = {},
  fuelOption = "",
}) => {

  

  /*
   * ----------------------------------------------------------
   * Safety check
   * ----------------------------------------------------------
   */
  if (!component) {
    return null;
  }


  const componentId =
    Number(
      component.ComponentID ??
      component.componentId
    );


  const componentCode =
    component.ComponentCode ??
    component.componentCode ??
    null;


  const componentName =
    component.ComponentName ??
    component.componentName ??
    null;


  const componentType =
    component.ComponentType ??
    component.componentType ??
    null;


  const isEarning =
    Boolean(
      component.IsEarning ??
      component.isEarning
    );


  const isDeduction =
    Boolean(
      component.IsDeduction ??
      component.isDeduction
    );


  const isEmployerCost =
    Boolean(
      component.IsEmployerCost ??
      component.isEmployerCost
    );


  const isTaxable =
    Boolean(
      component.IsTaxable ??
      component.isTaxable
    );


  /*
   * ----------------------------------------------------------
   * Frequency
   * ----------------------------------------------------------
   */
  const calculationFrequency =
    rule?.CalculationFrequency ??
    rule?.calculationFrequency ??
    component.CalculationFrequency ??
    component.calculationFrequency ??
    "Monthly";


  const baseFrequency =
    rule?.BaseFrequency ??
    rule?.baseFrequency ??
    component.BaseFrequency ??
    component.baseFrequency ??
    "Monthly";


  /*
   * ----------------------------------------------------------
   * Eligibility
   * ----------------------------------------------------------
   */
  if (
    eligibilityStatus === "Not Eligible" ||
    component.eligible === false
  ) {

    return {
      componentId,
      componentCode,
      componentName,
      componentType,

      isEarning,
      isDeduction,
      isEmployerCost,
      isTaxable,

      eligibilityStatus: "Not Eligible",

      calculationType:
        "Not Eligible",

      calculationFrequency,

      baseFrequency,

      monthlyAmount: 0,

      annualizedAmount: 0,

      rule,

      rate,

      reason:
        component.reason ||
        "Component is not eligible",
    };
  }

    // ----------------------------------------------------------
  // COMPANY ACCOMMODATION: HRA AND HHA CONDITIONS
  // ----------------------------------------------------------

  const accommodationStatus = String(
    accommodation.companyAccommodation || ""
  )
    .trim()
    .toLowerCase();

  const accommodationType = String(
    accommodation.accommodationType || ""
  )
    .trim()
    .toLowerCase();

  const isCompanyAccommodation =
    accommodationStatus === "yes";

  const isHostel =
    accommodationType === "hostel";

  // HRA must be zero when company accommodation is provided.
  if (
    String(componentCode || "").trim().toUpperCase() === "HRA" &&
    isCompanyAccommodation
  ) {
    return {
      componentId,
      componentCode,
      componentName,
      componentType,
      isEarning,
      isDeduction,
      isEmployerCost,
      isTaxable,
      eligibilityStatus: "Eligible",
      calculationStatus: "Calculated",
      calculationType: "Accommodation Rule",
      calculationFrequency,
      baseFrequency,
      monthlyAmount: 0,
      annualizedAmount: 0,
      rule,
      rate,
      reason: "HRA is not applicable when company accommodation is provided",
    };
  }

  // HHA is applicable only when company accommodation is Hostel.
  if (
    String(componentCode || "").trim().toUpperCase() === "HHA" &&
    !(isCompanyAccommodation && isHostel)
  ) {
    return {
      componentId,
      componentCode,
      componentName,
      componentType,
      isEarning,
      isDeduction,
      isEmployerCost,
      isTaxable,
      eligibilityStatus: "Eligible",
      calculationStatus: "Calculated",
      calculationType: "Accommodation Rule",
      calculationFrequency,
      baseFrequency,
      monthlyAmount: 0,
      annualizedAmount: 0,
      rule,
      rate,
      reason: "HHA is applicable only for Hostel accommodation",
    };
  }


  /*
   * ----------------------------------------------------------
   * BASIC SALARY
   *
   * Basic is entered by the user.
   * It is NOT calculated from a DB rule.
   * ----------------------------------------------------------
   */
  if (componentId === 10) {

    const amount =
      toNumber(basicSalary);


    return {
      componentId,
      componentCode,
      componentName,
      componentType,

      isEarning,
      isDeduction,
      isEmployerCost,
      isTaxable,

      eligibilityStatus: "Eligible",

      calculationType: "Input",

      calculationFrequency: "Monthly",

      baseFrequency: "Monthly",

      monthlyAmount: amount,

      annualizedAmount: amount * 12,

      rule: null,

      rate: null,
    };
  }


  /*
   * ----------------------------------------------------------
   * NO RULE
   * ----------------------------------------------------------
   */
  if (!rule) {

    return {
      componentId,
      componentCode,
      componentName,
      componentType,

      isEarning,
      isDeduction,
      isEmployerCost,
      isTaxable,

      eligibilityStatus:
        eligibilityStatus || "Eligible",

      calculationType:
        component.CalculationType ||
        "No Rule",

      calculationFrequency,

      baseFrequency,

      monthlyAmount: 0,

      annualizedAmount: 0,

      rule: null,

      rate: null,

      reason:
        "No active calculation rule found",
    };
  }


  /*
   * ----------------------------------------------------------
   * CALCULATION TYPE
   * ----------------------------------------------------------
   */
  const calculationType =
    String(
      rule.CalculationType ??
      rule.calculationType ??
      component.CalculationType ??
      ""
    )
      .trim()
      .toLowerCase();


  let calculatedAmount = 0;

  let calculationStatus = "Calculated";

  let reason = null;


 
/*
 * ============================================================
 * FIXED
 * ============================================================
 */
if (calculationType === "fixed") {
  const hasRateAmount =
    rate?.RateValue !== null && rate?.RateValue !== undefined ||
    rate?.FixedAmount !== null && rate?.FixedAmount !== undefined ||
    rate?.rateValue !== null && rate?.rateValue !== undefined ||
    rate?.fixedAmount !== null && rate?.fixedAmount !== undefined;

  const hasRuleAmount =
    rule?.FixedAmount !== null && rule?.FixedAmount !== undefined ||
    rule?.fixedAmount !== null && rule?.fixedAmount !== undefined;

  if (!hasRateAmount && !hasRuleAmount) {
    calculationStatus = "Input Required";
    reason = "Fixed component requires a configured rate or rule amount";
    calculatedAmount = 0;
  } else {
    calculatedAmount = calculateFixedComponent(rate, rule);
    calculationStatus = "Calculated";
    reason = null;
  }
}



  /*
   * ----------------------------------------------------------
   * PERCENTAGE
   * ----------------------------------------------------------
   */
 else if (
  calculationType === "percentage" ||
  calculationType === "percent"
) {

  calculatedAmount =
    calculatePercentageComponent({
      rule,
      rate,
      basicSalary,
      calculatedComponents,
    });
}


  /*
   * ----------------------------------------------------------
   * FORMULA
   * ----------------------------------------------------------
   */
  else if (calculationType === "formula") {

  const formulaResult =
    calculateFormulaComponent({
      rule,
      rate,
      reimbursementInput,
      fuelOption,
    });

  calculatedAmount =
    Number(formulaResult.amount) || 0;

  calculationStatus =
    formulaResult.status;

  reason =
    formulaResult.reason;
}


  /*
   * ----------------------------------------------------------
   * VARIABLE
   * ----------------------------------------------------------
   */
  else if (calculationType === "variable") {

  if (!rate) {
    calculationStatus = "Input Required";

    reason =
      "Variable component requires a configured rate";

    calculatedAmount = 0;
  } else {

    calculatedAmount = toNumber(
      rate.RateValue ??
      rate.rateValue ??
      0
    );
  }
}


  /*
   * ----------------------------------------------------------
   * UNKNOWN
   * ----------------------------------------------------------
   */
  else {

    calculationStatus =
      "No Rule";

    reason =
      `Unsupported calculation type: ${
        calculationType || "unknown"
      }`;

    calculatedAmount = 0;
  }


  /*
   * ----------------------------------------------------------
   * Convert configured amount to monthly amount.
   *
   * Example:
   *
   * LTA = 41,500 Annual
   *
   * monthlyAmount =
   * 41,500 / 12
   * ----------------------------------------------------------
   */
  const monthlyAmount =
    normalizeAmountByFrequency(
      calculatedAmount,
      calculationFrequency
    );


  /*
   * ----------------------------------------------------------
   * Annual amount
   * ----------------------------------------------------------
   */
  const annualizedAmount =
    monthlyAmount * 12;


  /*
   * ----------------------------------------------------------
   * Final result
   * ----------------------------------------------------------
   */
  return {

    componentId,

    componentCode,

    componentName,

    componentType,

    isEarning,

    isDeduction,

    isEmployerCost,

    isTaxable,

    eligibilityStatus:
      eligibilityStatus || "Eligible",

    calculationStatus,

    calculationType:
      rule.CalculationType ||
      component.CalculationType ||
      null,

    calculationFrequency,

    baseFrequency,

    monthlyAmount,

    annualizedAmount,

    rule,

    rate,

    reason,
  };
};


/**
 * ============================================================
 * CALCULATE ALL COMPONENTS
 * ============================================================
 */
export const calculateAllComponents = ({
  resolvedComponents = [],
  basicSalary = 0,
  options = {},
}) => {

  /*
   * ----------------------------------------------------------
   * Safety
   * ----------------------------------------------------------
   */
  if (!Array.isArray(resolvedComponents)) {
    return [];
  }


  const calculatedComponents = [];


  /*
   * ----------------------------------------------------------
   * Calculate sequentially.
   *
   * This is important because a later component may depend
   * on an earlier component.
   *
   * Example:
   *
   * Basic
   *   ↓
   * Personal Allowance
   *   ↓
   * Another percentage component
   * ----------------------------------------------------------
   */
  for (const resolvedComponent of resolvedComponents) {

    if (!resolvedComponent) {
      continue;
    }


    const component =
      resolvedComponent;


    const componentId =
      Number(
        component.ComponentID ??
        component.componentId
      );


    /*
     * --------------------------------------------------------
     * Basic Salary
     * --------------------------------------------------------
     */
    if (componentId === 10) {

      const basicResult =
        calculateComponent({
          component,
          rule: null,
          rate: null,
          basicSalary,
          calculatedComponents,
          eligibilityStatus: "Eligible",
        });


      if (basicResult) {
        calculatedComponents.push(
          basicResult
        );
      }

      continue;
    }


    /*
     * --------------------------------------------------------
     * Determine eligibility status
     * --------------------------------------------------------
     */
    const eligibilityStatus =
      component.eligibilityStatus ??
      (
        component.eligible === false
          ? "Not Eligible"
          : "Eligible"
      );


    /*
     * --------------------------------------------------------
     * Calculate component
     * --------------------------------------------------------
     */
    const result = calculateComponent({
  component,
  rule: component.rule || null,
  rate: component.rate || null,
  basicSalary,
  calculatedComponents,
  eligibilityStatus,
  accommodation: options.accommodation || {},
  reimbursementInput:
    options.reimbursementInput || {},
  fuelOption: options.fuelOption || "",
});


    /*
     * --------------------------------------------------------
     * Never push undefined results.
     * --------------------------------------------------------
     */
    if (result) {

      calculatedComponents.push(
        result
      );
    }
  }


  return calculatedComponents;
};