import {
  calculateCTCService,
  getEmployeeSalaryContextService,
  getSalaryComponentConfigurationsService,
  getCTCByIdService,
  getCTCByEmployeeService,
} from "../services/ctcCalculationService.js";

// Calculate and save CTC
export const calculateCTC = async (req, res) => {
  try {
    const result = await calculateCTCService(req.body);

    res.status(201).json({
      success: true,
      message: "CTC calculated successfully",
      data: result,
    });
  } catch (error) {
    console.error("CTC Calculation Error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


// Get employee + grade salary context
export const getEmployeeSalaryContext = async (req, res) => {
  try {
    const result = await getEmployeeSalaryContextService(
      req.params.employeeId,
      req.query.effectiveDate
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get Employee Salary Context Error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


// Get salary component configuration for an employee
export const getSalaryComponentConfigurations = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { effectiveDate } = req.query;

    const options = req.body || {};

    const result = await getSalaryComponentConfigurationsService(
      employeeId,
      effectiveDate,
      options
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Get Salary Component Configuration Error:",
      error
    );

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get CTC calculation by ID
export const getCTCById = async (req, res) => {
  try {
    const result = await getCTCByIdService(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "CTC calculation not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get CTC Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get CTC history by employee
export const getCTCByEmployee = async (req, res) => {
  try {
    const result = await getCTCByEmployeeService(req.params.employeeId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get Employee CTC Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};