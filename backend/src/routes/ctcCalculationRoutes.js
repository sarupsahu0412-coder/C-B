import express from "express";

import {
  calculateCTC,
  getEmployeeSalaryContext,
  getSalaryComponentConfigurations,
  getCTCById,
  getCTCByEmployee,
} from "../controllers/ctcCalculationController.js";

const router = express.Router();

// Calculate and save CTC
router.post("/calculate", calculateCTC);

// Get employee + grade + salary context
router.get(
  "/context/employee/:employeeId",
  getEmployeeSalaryContext
);

// Get salary component configuration
router.get(
  "/components/employee/:employeeId",
  getSalaryComponentConfigurations
);

// Get CTC calculation history for an employee
router.get(
  "/employee/:employeeId",
  getCTCByEmployee
);

// Get one CTC calculation
router.get("/:id", getCTCById);

export default router;