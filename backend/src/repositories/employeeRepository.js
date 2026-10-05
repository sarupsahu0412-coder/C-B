import { getPool } from "../config/db.js";

export async function getAllEmployees() {
  const pool = getPool();

  const result = await pool.request().query(`
    SELECT
      EmployeeID,
      EmployeeCode,
      FirstName,
      MiddleName,
      LastName
    FROM Employees
    ORDER BY EmployeeID
  `);

  return result.recordset;
}