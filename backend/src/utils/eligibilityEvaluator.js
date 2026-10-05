/**
 * Salary Component Eligibility Evaluator
 *
 * Evaluates database-driven eligibility conditions
 * against an employee CTC context.
 *
 * Condition groups:
 *
 * - Conditions inside the same group = AND
 * - Different groups = OR
 *
 * Example:
 *
 * Group 1:
 *   EmploymentType = FTC
 *   Designation = Manager
 *
 * Group 2:
 *   EmploymentType = FTM
 *   Designation = Manager
 *
 * Result:
 *   (FTC AND Manager) OR (FTM AND Manager)
 */

/**
 * Compare an actual value with an expected value
 * using the configured operator.
 */
const compareValue = (
  actualValue,
  operator,
  expectedValue
) => {
  // Null / undefined cannot satisfy a condition.
  if (
    actualValue === null ||
    actualValue === undefined
  ) {
    return false;
  }

  // String comparison for = and !=
  const actual = String(actualValue)
    .trim()
    .toLowerCase();

  const expected = String(expectedValue)
    .trim()
    .toLowerCase();

  switch (operator) {
    case "=":
      return actual === expected;

    case "!=":
      return actual !== expected;

    case ">":
      return Number(actualValue) > Number(expectedValue);

    case ">=":
      return Number(actualValue) >= Number(expectedValue);

    case "<":
      return Number(actualValue) < Number(expectedValue);

    case "<=":
      return Number(actualValue) <= Number(expectedValue);

    default:
      return false;
  }
};

/**
 * Convert database attribute codes such as:
 *
 * COMPANY_PENSION
 * CAR_TYPE
 * COMPANY_ACCOMMODATION
 *
 * into:
 *
 * companyPension
 * carType
 * companyAccommodation
 */
const attributeCodeToProperty = (
  attributeCode
) => {
  if (!attributeCode) {
    return null;
  }

  return String(attributeCode)
    .trim()
    .toLowerCase()
    .replace(
      /_([a-z])/g,
      (_, letter) => letter.toUpperCase()
    );
};

/**
 * Get an attribute value from employee context
 * or options.
 *
 * Priority:
 *
 * 1. Exact employeeContext property
 * 2. camelCase employeeContext property
 * 3. Exact options property
 * 4. camelCase options property
 */

const getAttributeValue = (
  attributeCode,
  employeeContext,
  options = {}
) => {
  if (!attributeCode || !employeeContext) {
    return null;
  }

  // Accommodation values supplied in the current calculation request
// take priority over stored employee attributes.
const accommodation = options.accommodation || {};

if (attributeCode === "COMPANY_ACCOMMODATION") {
  return accommodation.companyAccommodation ?? null;
}

if (attributeCode === "HOSTEL_ACCOMMODATION") {
  const companyAccommodation = String(
    accommodation.companyAccommodation || ""
  ).trim().toLowerCase();

  const accommodationType = String(
    accommodation.accommodationType || ""
  ).trim().toLowerCase();

  return companyAccommodation === "yes" &&
    accommodationType === "hostel"
    ? "Yes"
    : "No";
}

  // 1. Direct employee context property
  if (
    Object.prototype.hasOwnProperty.call(
      employeeContext,
      attributeCode
    )
  ) {
    return employeeContext[attributeCode];
  }

  // 2. Convert SNAKE_CASE to camelCase
  const camelCaseKey = attributeCode
    .toLowerCase()
    .split("_")
    .map((part, index) => {
      if (index === 0) {
        return part;
      }

      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");

  if (
    Object.prototype.hasOwnProperty.call(
      employeeContext,
      camelCaseKey
    )
  ) {
    return employeeContext[camelCaseKey];
  }

  // 3. EmployeeCompensationAttributes
  if (
    employeeContext.attributes &&
    Object.prototype.hasOwnProperty.call(
      employeeContext.attributes,
      attributeCode
    )
  ) {
    return employeeContext.attributes[attributeCode];
  }

  // 4. Direct options property
  if (
    Object.prototype.hasOwnProperty.call(
      options,
      attributeCode
    )
  ) {
    return options[attributeCode];
  }

  // 5. CamelCase options property
  if (
    Object.prototype.hasOwnProperty.call(
      options,
      camelCaseKey
    )
  ) {
    return options[camelCaseKey];
  }

  

  return null;
};


/**
 * Evaluate a single eligibility condition.
 */
const evaluateCondition = (
  condition,
  employeeContext,
  options = {}
) => {
  const {
    GradeID,
    LevelID,
    EmploymentTypeID,
    LocationID,
    DesignationID,
  } = employeeContext;

  let actualValue = null;
  let expectedValue = condition.ValueText;

  // --------------------------------------------------
  // Determine primary condition
  // --------------------------------------------------

  switch (condition.ConditionType) {
    case "Grade":
      actualValue = GradeID;

      expectedValue =
        condition.GradeID ??
        condition.ValueText;

      break;

    case "Level":
      actualValue = LevelID;

      expectedValue =
        condition.LevelID ??
        condition.ValueText;

      break;

    case "EmploymentType":
      actualValue = EmploymentTypeID;

      expectedValue =
        condition.EmploymentTypeID ??
        condition.ValueText;

      break;

    case "Location":
      actualValue = LocationID;

      expectedValue =
        condition.LocationID ??
        condition.ValueText;

      break;

    case "Designation":
      actualValue = DesignationID;

      expectedValue =
        condition.DesignationID ??
        condition.ValueText;

      break;

    case "Attribute":
      actualValue = getAttributeValue(
        condition.AttributeCode,
        employeeContext,
        options
      );

      expectedValue = condition.ValueText;

      break;

    default:
      return false;

      
  }

 // Debug the HRA and accommodation conditions
if (
  condition.AttributeCode === "COMPANY_ACCOMMODATION" ||
  condition.ConditionType === "Location"
) {

  console.log("FULL CONDITION OBJECT:", condition);

  console.log("HRA CONDITION DEBUG:", {
    componentEligibilityId: condition.ComponentEligibilityID,
    eligibilityConditionId: condition.EligibilityConditionID,
    conditionGroup: condition.ConditionGroup,

    conditionType: condition.ConditionType,
    attributeCode: condition.AttributeCode,
    actualValue,
    operator: condition.Operator,
    expectedValue,
    actualType: typeof actualValue,
    expectedType: typeof expectedValue,
  });
}

console.log("===== VEHICLE ELIGIBILITY DEBUG =====");

if (
  condition.AttributeCode === "CAR_TYPE" ||
  condition.AttributeCode === "COMPANY_CAR" ||
  condition.ConditionType === "Level"
) {
  console.log({
    conditionGroup: condition.ConditionGroup,
    conditionType: condition.ConditionType,
    attributeCode: condition.AttributeCode,
    actualValue,
    expectedValue,
    operator: condition.Operator,
    actualType: typeof actualValue,
    expectedType: typeof expectedValue,
    LevelID: employeeContext.LevelID,
    attributes: employeeContext.attributes
  });
}

 

  // --------------------------------------------------
  // Primary condition evaluation
  // --------------------------------------------------

  const primaryConditionPassed =
    compareValue(
      actualValue,
      condition.Operator,
      expectedValue
    );

 

  if (!primaryConditionPassed) {
    return false;
  }

  // --------------------------------------------------
  // Additional condition dimensions
  //
  // A condition can have more than one dimension.
  //
  // Example:
  //
  // EmploymentType = FTC
  // AND DesignationID = Manager
  // --------------------------------------------------

  // Designation
  if (
    condition.DesignationID !== null &&
    condition.DesignationID !== undefined
  ) {
    if (
      Number(DesignationID) !==
      Number(condition.DesignationID)
    ) {
      return false;
    }
  }

  // Grade
  if (
    condition.GradeID !== null &&
    condition.GradeID !== undefined &&
    condition.ConditionType !== "Grade"
  ) {
    if (
      Number(GradeID) !==
      Number(condition.GradeID)
    ) {
      return false;
    }
  }

  // Level
  if (
    condition.LevelID !== null &&
    condition.LevelID !== undefined &&
    condition.ConditionType !== "Level"
  ) {
    if (
      Number(LevelID) !==
      Number(condition.LevelID)
    ) {
      return false;
    }
  }

  // Location
  if (
    condition.LocationID !== null &&
    condition.LocationID !== undefined &&
    condition.ConditionType !== "Location"
  ) {
    if (
      Number(LocationID) !==
      Number(condition.LocationID)
    ) {
      return false;
    }
  }

  // Employment Type
  if (
    condition.EmploymentTypeID !== null &&
    condition.EmploymentTypeID !== undefined &&
    condition.ConditionType !== "EmploymentType"
  ) {
    if (
      Number(EmploymentTypeID) !==
      Number(condition.EmploymentTypeID)
    ) {
      return false;
    }
  }

  return true;
};

/**
 * Evaluate one eligibility definition.
 *
 * Conditions in the same ConditionGroup:
 *
 *     AND
 *
 * Different ConditionGroups:
 *
 *     OR
 */
export const evaluateEligibility = (
  eligibility,
  conditions,
  employeeContext,
  options = {}
) => {
  // --------------------------------------------------
  // Get conditions belonging to this eligibility
  // --------------------------------------------------

  const eligibilityConditions =
    conditions.filter(
      (condition) =>
        Number(
          condition.ComponentEligibilityID
        ) ===
        Number(
          eligibility.ComponentEligibilityID
        )
    );


    if (eligibility.EligibilityCode === "APB_ELIGIBILITY") {
  console.log("===== APB ELIGIBILITY DEBUG =====");
  console.log("Eligibility:", eligibility);
  console.log("Employee context:", employeeContext);
  console.log("APB conditions:", eligibilityConditions);
}



  // --------------------------------------------------
  // No conditions configured
  // --------------------------------------------------

 if (eligibilityConditions.length === 0) {
  return {
    eligible: true,
    requiresInput: false,

    eligibilityId:
      eligibility.ComponentEligibilityID,

    componentId:
      eligibility.ComponentID,

    eligibilityCode:
      eligibility.EligibilityCode,

    reason:
      "No eligibility conditions configured; applicable to all employees",
  };
}

 

  // --------------------------------------------------
  // Group conditions by ConditionGroup
  // --------------------------------------------------
  //
  // Example:
  //
  // Group 1:
  //   EmploymentType = FTC
  //   Designation = Manager
  //
  // Group 2:
  //   EmploymentType = FTM
  //   Designation = Manager
  //
  // Means:
  //
  // (FTC AND Manager)
  // OR
  // (FTM AND Manager)
  // --------------------------------------------------

  const groups = {};

  for (
    const condition of eligibilityConditions
  ) {
    const groupNumber =
      condition.ConditionGroup ?? 1;

    if (!groups[groupNumber]) {
      groups[groupNumber] = [];
    }

    groups[groupNumber].push(
      condition
    );
  }

  

  // --------------------------------------------------
  // Evaluate each group
  // --------------------------------------------------

  for (
    const [
      groupNumber,
      groupConditions,
    ] of Object.entries(groups)
  ) {
    const groupPassed =
      groupConditions.every(
        (condition) =>
          evaluateCondition(
            condition,
            employeeContext,
            options
          )
      );

    // ------------------------------------------------
    // OR logic between groups
    // ------------------------------------------------

    if (groupPassed) {
      return {
        eligible: true,
        requiresInput: false,

        eligibilityId:
          eligibility.ComponentEligibilityID,

        componentId:
          eligibility.ComponentID,

        eligibilityCode:
          eligibility.EligibilityCode,

        matchedGroup:
          Number(groupNumber),

        reason:
          "Eligibility conditions satisfied",
      };
    }
  }

  // --------------------------------------------------
  // No group passed
  // --------------------------------------------------

  return {
    eligible: false,
    requiresInput: false,

    eligibilityId:
      eligibility.ComponentEligibilityID,

    componentId:
      eligibility.ComponentID,

    eligibilityCode:
      eligibility.EligibilityCode,

    reason:
      "Eligibility conditions not satisfied",
  };
};

/**
 * Evaluate all eligibility definitions.
 */

export const evaluateAllEligibility = (
  eligibilityList,
  conditions,
  employeeContext,
  options = {}
) => {

  // Support object-style calls:
  // evaluateAllEligibility({
  //   eligibility,
  //   conditions,
  //   employeeContext
  // })

  if (
    eligibilityList &&
    !Array.isArray(eligibilityList) &&
    typeof eligibilityList === "object" &&
    (
      Object.prototype.hasOwnProperty.call(
        eligibilityList,
        "eligibility"
      ) ||
      Object.prototype.hasOwnProperty.call(
        eligibilityList,
        "employeeContext"
      )
    )
  ) {
    const input = eligibilityList;

    eligibilityList = input.eligibility;
    conditions = input.conditions;
    employeeContext = input.employeeContext;
    options = input.options ?? {};
  }

  // Normalize SQL recordsets and arrays.
  const normalizeArray = (value) => {
    if (Array.isArray(value)) {
      return value;
    }

    if (Array.isArray(value?.recordset)) {
      return value.recordset;
    }

    // Also support a single eligibility object.
    if (
      value &&
      typeof value === "object" &&
      value.ComponentEligibilityID !== undefined
    ) {
      return [value];
    }

    return [];
  };

  const eligibilityArray = normalizeArray(eligibilityList);
  const conditionsArray = normalizeArray(conditions);

  // Prevent errors if employee context is missing.
  const context =
    employeeContext &&
    typeof employeeContext === "object"
      ? employeeContext
      : {};

  return eligibilityArray.map((eligibility) =>
    evaluateEligibility(
      eligibility,
      conditionsArray,
      context,
      options
    )
  );
};
