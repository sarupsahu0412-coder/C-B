import { getAllEmployees } from "../repositories/employeeRepository.js";

export async function getEmployeesService() {
  const employees = await getAllEmployees();

  return employees.map((employee) => ({
    employeeId: employee.EmployeeID,
    employeeCode: employee.EmployeeCode,
    firstName: employee.FirstName,
    middleName: employee.MiddleName,
    lastName: employee.LastName,
    employeeName: [
      employee.FirstName,
      employee.MiddleName,
      employee.LastName,
    ]
      .filter(Boolean)
      .join(" "),
  }));
}