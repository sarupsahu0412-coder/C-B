import { connectDB } from "./src/config/db.js";
import { getSalaryComponentConfigurations } from "./src/repositories/ctcCalculationRepository.js";

const employeeId = 8;
const effectiveDate = "2026-09-09";

try {
    await connectDB();

    const configuration = await getSalaryComponentConfigurations(
        employeeId,
        effectiveDate
    );

    console.log("\n===== SALARY COMPONENT CONFIGURATION =====\n");

    console.log("Employee:");
    console.log(configuration.employee);

    console.log("\nSpecial Allowance Component:");
    console.log(
        configuration.components.filter(
    c => Number(c.ComponentID) === 16
)
    );

    console.log("\nSpecial Allowance Rules:");
    console.log(
        configuration.rates.filter(
    r => Number(r.ComponentID) === 16
)
    );

    console.log("\nSpecial Allowance Rates:");
    console.log(
        configuration.rates.filter(
            r => r.ComponentID === 16
        )
    );

    console.log("\nSpecial Allowance Eligibility:");
    console.log(
        configuration.eligibility.filter(
            e => e.ComponentID === 16
        )
    );

    console.log("\nSpecial Allowance Conditions:");
    console.log(
        configuration.conditions.filter(
            c => c.ComponentEligibilityID === 13
        )
    );

    console.log("\nALL COMPONENTS:");
console.table(configuration.components);

} catch (error) {
    console.error("\n===== CONFIGURATION ERROR =====");
    console.error(error);
}