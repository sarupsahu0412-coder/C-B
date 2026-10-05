/**
 * Resolve the most specific salary component rate
 * for an employee.
 *
 * Supported dimensions:
 *
 * - GradeID
 * - EmploymentTypeID
 * - LocationID
 * - DesignationID
 * - LevelMin / LevelMax
 * - AttributeCode / AttributeValue
 *
 * More specific rates are preferred over generic rates.
 */

/**
 * Check whether a value is null or undefined.
 */
const isNullOrUndefined = (value) => {
  return value === null || value === undefined;
};

/**
 * Match an ID-based condition.
 *
 * If the rate does not specify the dimension,
 * it is treated as a wildcard.
 */
const matchesId = (rateValue, employeeValue) => {
  /*
   * No restriction on this dimension.
   */
  if (isNullOrUndefined(rateValue)) {
    return true;
  }

  /*
   * Rate has a restriction, but employee has
   * no corresponding value.
   */
  if (isNullOrUndefined(employeeValue)) {
    return false;
  }

  return Number(rateValue) === Number(employeeValue);
};

/**
 * Get an employee attribute using AttributeCode.
 *
 * Example:
 *
 * COMPANY_PENSION
 *        ↓
 * employeeContext.CompanyPension
 *
 * PENSION_TYPE
 *        ↓
 * employeeContext.PensionType
 */
const getAttributeValue = (attributeCode, employeeContext) => {
  if (!attributeCode || !employeeContext) {
    return null;
  }

  /*
   * 1. Employee table attributes
   */
  const employeeAttributeMap = {
    COMPANY_PENSION: employeeContext.CompanyPension,
    PENSION_TYPE: employeeContext.PensionType,
  };

  if (
    Object.prototype.hasOwnProperty.call(
      employeeAttributeMap,
      attributeCode
    )
  ) {
    return employeeAttributeMap[attributeCode];
  }

  /*
   * 2. EmployeeCompensationAttributes table
   */
  if (employeeContext.attributes) {
    const attributeValue =
      employeeContext.attributes[attributeCode];

    if (attributeValue !== undefined) {
      return attributeValue;
    }
  }

  /*
   * 3. Generic camelCase fallback
   *
   * COMPANY_PENSION
   *       ↓
   * companyPension
   */
  const camelCaseKey = attributeCode
    .toLowerCase()
    .split("_")
    .map((part, index) => {
      if (index === 0) {
        return part;
      }

      return (
        part.charAt(0).toUpperCase() +
        part.slice(1)
      );
    })
    .join("");

  return (
    employeeContext[attributeCode] ??
    employeeContext[camelCaseKey] ??
    null
  );
};

/**
 * Normalize attribute values before comparison.
 *
 * Examples:
 *
 * false → "0"
 * true  → "1"
 * 0     → "0"
 * 1     → "1"
 *
 * Therefore:
 *
 * CompanyPension = false
 *
 * matches:
 *
 * AttributeValue = "0"
 */
const normalizeAttributeValue = (value) => {
  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }

  const normalized = String(value)
    .trim()
    .toLowerCase();

  if (normalized === "true") {
    return "1";
  }

  if (normalized === "false") {
    return "0";
  }

  return normalized;
};

/**
 * Match an attribute-based condition.
 */
const matchesAttribute = (
  rate,
  employeeContext
) => {
  /*
   * No attribute restriction.
   */
  if (
    isNullOrUndefined(rate.AttributeCode) ||
    rate.AttributeCode === ""
  ) {
    return true;
  }

  const actualValue = getAttributeValue(
    rate.AttributeCode,
    employeeContext
  );

  /*
   * Employee does not contain the required
   * attribute.
   */
  if (isNullOrUndefined(actualValue)) {
    return false;
  }

  /*
   * Rate has an attribute condition but no
   * expected value.
   */
  if (isNullOrUndefined(rate.AttributeValue)) {
    return false;
  }

  return (
    normalizeAttributeValue(actualValue) ===
    normalizeAttributeValue(rate.AttributeValue)
  );
};

/**
 * Match employee LevelID against a rate's
 * LevelMin / LevelMax range.
 *
 * Examples:
 *
 * LevelMin = 1
 * LevelMax = 4
 *
 * matches:
 *
 * Level 1
 * Level 2
 * Level 3
 * Level 4
 */
const matchesLevelRange = (
  rate,
  employeeContext
) => {
  const hasLevelMin =
    !isNullOrUndefined(rate.LevelMin);

  const hasLevelMax =
    !isNullOrUndefined(rate.LevelMax);

  /*
   * No level restriction.
   */
  if (!hasLevelMin && !hasLevelMax) {
    return true;
  }

  const employeeLevel = Number(
    employeeContext.LevelID
  );

  /*
   * Employee has no usable level.
   */
  if (Number.isNaN(employeeLevel)) {
    return false;
  }

  /*
   * Check minimum level.
   */
  if (
    hasLevelMin &&
    employeeLevel < Number(rate.LevelMin)
  ) {
    return false;
  }

  /*
   * Check maximum level.
   */
  if (
    hasLevelMax &&
    employeeLevel > Number(rate.LevelMax)
  ) {
    return false;
  }

  return true;
};

/**
 * Calculate the specificity score for a rate.
 *
 * Higher score = more specific rate.
 *
 * Priority:
 *
 * Attribute       = 100
 * Location        = 20
 * Designation     = 10
 * EmploymentType  = 10
 * Grade           = 5
 * Level range     = 5
 */
const getSpecificityScore = (rate) => {
  let score = 0;

  /*
   * Attribute-specific rate.
   *
   * Example:
   * COMPANY_PENSION = 0
   */
  if (
    !isNullOrUndefined(rate.AttributeCode) &&
    rate.AttributeCode !== ""
  ) {
    score += 100;
  }

  /*
   * Location-specific rate.
   */
  if (!isNullOrUndefined(rate.LocationID)) {
    score += 20;
  }

  /*
   * Designation-specific rate.
   */
  if (!isNullOrUndefined(rate.DesignationID)) {
    score += 10;
  }

  /*
   * Employment-type-specific rate.
   */
  if (
    !isNullOrUndefined(
      rate.EmploymentTypeID
    )
  ) {
    score += 10;
  }

  /*
   * Grade-specific rate.
   */
  if (!isNullOrUndefined(rate.GradeID)) {
    score += 5;
  }

  /*
   * Level-specific rate.
   */
  if (
    !isNullOrUndefined(rate.LevelMin) ||
    !isNullOrUndefined(rate.LevelMax)
  ) {
    score += 5;
  }

  return score;
};

/**
 * Resolve the most specific rate.
 *
 * @param {Array} rates
 * @param {number|string} componentId
 * @param {number|string} componentRuleId
 * @param {Object} employeeContext
 *
 * @returns {Object|null}
 */
export const resolveRate = (
  rates,
  componentId,
  componentRuleId,
  employeeContext
) => {
  /*
   * Invalid rates collection.
   */
  if (!Array.isArray(rates)) {
    return null;
  }

  /*
   * Employee context is required for
   * conditional rate resolution.
   */
  if (!employeeContext) {
    return null;
  }

  /*
   * --------------------------------------------------
   * 1. Find rates belonging to this component + rule
   * --------------------------------------------------
   */
  const candidateRates = rates.filter(
    (rate) => {
      /*
       * Component must match.
       */
      if (
        Number(rate.ComponentID) !==
        Number(componentId)
      ) {
        return false;
      }

      /*
       * Rule must match.
       */
      if (
        Number(rate.ComponentRuleID) !==
        Number(componentRuleId)
      ) {
        return false;
      }

      return true;
    }
  );

  /*
   * No rates configured for this
   * component/rule.
   */
  if (candidateRates.length === 0) {
    return null;
  }

  /*
   * --------------------------------------------------
   * 2. Filter rates according to employee context
   * --------------------------------------------------
   */
  const matchingRates =
    candidateRates.filter((rate) => {
      /*
       * Grade
       */
      if (
        !matchesId(
          rate.GradeID,
          employeeContext.GradeID
        )
      ) {
        return false;
      }

      /*
       * Employment Type
       */
      if (
        !matchesId(
          rate.EmploymentTypeID,
          employeeContext.EmploymentTypeID
        )
      ) {
        return false;
      }

      /*
       * Location
       */
      if (
        !matchesId(
          rate.LocationID,
          employeeContext.LocationID
        )
      ) {
        return false;
      }

      /*
       * Designation
       */
      if (
        !matchesId(
          rate.DesignationID,
          employeeContext.DesignationID
        )
      ) {
        return false;
      }

      /*
       * Level range
       */
      if (
        !matchesLevelRange(
          rate,
          employeeContext
        )
      ) {
        return false;
      }

      /*
       * Attribute
       */
      if (
        !matchesAttribute(
          rate,
          employeeContext
        )
      ) {
        return false;
      }

      return true;
    });

  /*
   * No rate matches the employee.
   */
  if (matchingRates.length === 0) {
    return null;
  }

  /*
   * --------------------------------------------------
   * 3. Select the most specific matching rate
   * --------------------------------------------------
   */
  matchingRates.sort((a, b) => {
    const scoreDifference =
      getSpecificityScore(b) -
      getSpecificityScore(a);

    /*
     * Higher specificity wins.
     */
    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    /*
     * Deterministic tie-breaker.
     *
     * Lower ComponentRateID wins when
     * specificity is identical.
     */
    return (
      Number(a.ComponentRateID) -
      Number(b.ComponentRateID)
    );
  });

  /*
   * The first rate is the most specific
   * matching rate.
   */
  return matchingRates[0];
};