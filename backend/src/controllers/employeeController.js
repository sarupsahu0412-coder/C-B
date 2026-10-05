import { getEmployeesService } from "../services/employeeService.js";

export async function getEmployees(req, res) {
  try {
    const employees = await getEmployeesService();

    return res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
      data: employees,
    });
  } catch (error) {
    console.error("Get employees error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve employees",
      error: error.message,
    });
  }
}