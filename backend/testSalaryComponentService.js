import { connectDB } from "./src/config/db.js";
import {
  getSalaryComponentConfigurationsService,
} from "./src/services/ctcCalculationService.js";

const employeeId = 8;
const effectiveDate = "2026-09-09";

try {
  await connectDB();

  const result = await getSalaryComponentConfigurationsService(
    employeeId,
    effectiveDate,
    {
      basicSalary: 25000,
    }
  );

  console.log("\n===== REAL CTC COMPONENT CONFIGURATION =====\n");

  console.log("Employee:");
  console.log(result.employee);

  const specialAllowance = result.calculatedComponents.find(
    (component) =>
      Number(component.componentId) === 16 ||
      Number(component.ComponentID) === 16
  );

  console.log("\n===== SPECIAL ALLOWANCE =====\n");
  console.dir(specialAllowance, { depth: null });

  console.log("\n===== ALL CALCULATED COMPONENTS =====\n");
  console.dir(result.calculatedComponents, { depth: null });

} catch (error) {
  console.error("\n===== SERVICE ERROR =====");
  console.error(error);
}