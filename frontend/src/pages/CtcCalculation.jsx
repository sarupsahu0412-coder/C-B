
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CompanyAccommodation from "../components/salary/CompanyAccommodation";

const API_URL = "http://localhost:5000";

// ---------------------------------------------------------
// Date helper
// ---------------------------------------------------------

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ---------------------------------------------------------
// Number and currency helpers
// ---------------------------------------------------------

function formatIndianNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "";
  }

  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}
function formatCurrency(value) {
  return `₹${formatIndianNumber(Number(value || 0))}`;
}

// Remove commas and return a number.
// An empty input remains an empty string.
function parseSalary(value) {
  const cleaned = String(value).replace(/,/g, "").trim();

  if (cleaned === "") {
    return "";
  }

  return Number(cleaned);
}

function formatBasicSalary(value) {
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  const digits = String(value).replace(/\D/g, "");

  if (digits === "") {
    return "";
  }

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(digits));
}

// ---------------------------------------------------------
// Main component
// ---------------------------------------------------------

function CtcCalculation() {
  const navigate = useNavigate();

  // -------------------------------------------------------
  // State
  // -------------------------------------------------------

  const [employeeId, setEmployeeId] = useState("");
  const [basicSalary, setBasicSalary] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(getToday());

  const [employees, setEmployees] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);

  const [employeeContext, setEmployeeContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);

  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [accommodation, setAccommodation] = useState({
  companyAccommodation: "",
  accommodationType: "",
  rent: "",
  maintenance: "",
  hha: "",
});

const [vehicleOption, setVehicleOption] = useState({
  companyCar: "",
  carType: "",
});

const [reimbursementInput, setReimbursementInput] = useState({
  fuel: {
    eligibleLitres: "",
  },
});

const [fuelOption, setFuelOption] = useState("");

  // -------------------------------------------------------
  // Load employees
  // -------------------------------------------------------

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setEmployeeLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/api/employees`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || data.error || "Failed to load employees."
          );
        }

        const employeeList = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
          ? data.data
          : [];

        setEmployees(employeeList);
      } catch (err) {
        console.error("Employee loading error:", err);
        setError(err.message || "Failed to load employees.");
      } finally {
        setEmployeeLoading(false);
      }
    };

    loadEmployees();
  }, []);

  // -------------------------------------------------------
  // Load employee context for selected employee and date
  // -------------------------------------------------------

  const loadEmployeeContext = async (id, date = effectiveDate) => {
    if (!id || !date) {
      setEmployeeContext(null);
      return;
    }

    try {
      setContextLoading(true);
      setError("");
      setEmployeeContext(null);
      setSalary(null);

      const response = await fetch(
        `${API_URL}/api/ctc-calculations/context/employee/${id}?effectiveDate=${encodeURIComponent(date)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Failed to load employee details."
        );
      }

      setEmployeeContext(data.data || data);
    } catch (err) {
      console.error("Employee context error:", err);
      setError(err.message || "Failed to load employee details.");
    } finally {
      setContextLoading(false);
    }
  };

 // -------------------------------------------------------
// Handle employee selection
// -------------------------------------------------------

const handleEmployeeChange = (value) => {
  setEmployeeId(value);

  // Clear the previous accommodation selection.
  setAccommodation({
    companyAccommodation: "",
    accommodationType: "",
    rent: "",
    maintenance: "",
    hha: "",
  });

  setVehicleOption({
  companyCar: "",
  carType: "",
});

setReimbursementInput({
  fuel: {
    eligibleLitres: "",
  },
});

setFuelOption("");

  // Clear the previous calculation.
  setBasicSalary("");
  setSalary(null);
  setError("");

  // Load the newly selected employee.
  if (value) {
    loadEmployeeContext(value, effectiveDate);
  } else {
    setEmployeeContext(null);
  }
};


  // -------------------------------------------------------
  // Handle effective date change
  // -------------------------------------------------------

  const handleEffectiveDateChange = (date) => {
    setEffectiveDate(date);
    setSalary(null);
    setError("");

    setVehicleOption({
  companyCar: "",
  carType: "",
});

    setReimbursementInput({
  fuel: {
    eligibleLitres: "",
  },
});

    setFuelOption("");

    if (employeeId && date) {
      loadEmployeeContext(employeeId, date);
    } else {
      setEmployeeContext(null);
    }
  };

  // -------------------------------------------------------
  // Handle Basic Salary input with Indian commas
  // -------------------------------------------------------

  const handleBasicSalaryChange = (value) => {
  const digitsOnly = value.replace(/[^\d]/g, "");

  if (digitsOnly === "") {
    setBasicSalary("");
  } else {
    setBasicSalary(formatBasicSalary(digitsOnly));
  }

  setSalary(null);
  setError("");
};

  // -------------------------------------------------------
  // Employee details and salary range
  // -------------------------------------------------------

  const employee = employeeContext || salary?.employee || null;


  const minimumSalary = Number(
    employee?.MinSalary ?? employee?.minSalary ?? 0
  );

  const maximumSalary = Number(
    employee?.MaxSalary ?? employee?.maxSalary ?? 0
  );

 

  // -------------------------------------------------------
  // Calculate CTC
  // -------------------------------------------------------

  const calculateCTC = async () => {
    setError("");
    setSalary(null);

    if (!employeeId) {
      setError("Please select an employee.");
      return;
    }

    if (!effectiveDate) {
      setError("Please select an effective date.");
      return;
    }

    if (!employeeContext) {
      setError("Employee details are not loaded. Please select the employee again.");
      return;
    }

    if (basicSalary === "") {
      setError("Please enter a Basic Salary.");
      return;
    }

    const enteredSalary = parseSalary(basicSalary);

    if (!Number.isFinite(enteredSalary) || enteredSalary <= 0) {
      setError("Please enter a valid Basic Salary greater than zero.");
      return;
    }

    // -----------------------------------------------------
    // Validate minimum salary
    // -----------------------------------------------------

    if (minimumSalary > 0 && enteredSalary < minimumSalary) {
      setError(
        `Basic Salary must be at least ${formatCurrency(minimumSalary)} per month.`
      );
      return;
    }

    // -----------------------------------------------------
    // Validate maximum salary
    // -----------------------------------------------------

    if (maximumSalary > 0 && enteredSalary > maximumSalary) {
      setError(
        `Basic Salary cannot exceed ${formatCurrency(maximumSalary)} per month.`
      );
      return;
    }

    // -----------------------------------------------------
    // Call calculation API
    // -----------------------------------------------------

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/ctc-calculations/calculate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
  employeeId: Number(employeeId),
  effectiveDate,
  basicSalary: enteredSalary,
  accommodation,
  vehicleOption,
  reimbursementInput,
  fuelOption,
}),
        }
      );

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || data.error || "Failed to calculate CTC."
        );
      }

      // Your API wrapper returns the result inside data.data.
      const calculationResult = data.data ?? data;

      setSalary(calculationResult);
    } catch (err) {
      console.error("CTC calculation error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------
  // Clear form
  // -------------------------------------------------------

 const clearCalculation = () => {
  setEmployeeId("");
  setBasicSalary("");
  setEffectiveDate(getToday());
  setEmployeeContext(null);
  setSalary(null);
  setError("");

  setAccommodation({
    companyAccommodation: "",
    accommodationType: "",
    rent: "",
    maintenance: "",
    hha: "",
  });

  setVehicleOption({
  companyCar: "",
  carType: "",
});

  setReimbursementInput({
  fuel: {
    eligibleLitres: "",
  },
});

  setFuelOption("");
};

  // -------------------------------------------------------
  // Calculation response values
  // -------------------------------------------------------

  const components = salary?.components || [];
  const totals = salary?.totals || {};

  const monthlyGross = totals.monthlyGross ?? 0;
  const annualMonthlyGross = totals.annualMonthlyGross ?? 0;
  const monthlyRetirals = totals.monthlyRetirals ?? 0;
  const annualRetirals = totals.annualRetirals ?? 0;

  const currentMonthlyGrossPlusRetirals =
    totals.currentMonthlyGrossPlusRetirals ?? 0;

  const currentAnnualGrossPlusRetirals =
    totals.currentAnnualGrossPlusRetirals ?? 0;

  const annualFixed = totals.annualFixed ?? 0;
  const fixedCTCInLakhs = totals.fixedCTCInLakhs ?? 0;
  const finalCTCInLakhs = totals.finalCTCInLakhs ?? 0;

  const monthlyCTC = totals.monthlyCTC ?? salary?.monthlyCTC ?? 0;
  const annualCTC = totals.annualCTC ?? salary?.annualCTC ?? 0;


  

const selectedEmployee = employeeContext || salary?.employee || null;

const locationId = Number(
  selectedEmployee?.LocationID ??
    selectedEmployee?.locationId ??
    selectedEmployee?.LocationID
);

const showCompanyAccommodation = [2, 6, 7].includes(locationId);

const employeeLevel = Number(
  selectedEmployee?.LevelID ??
    selectedEmployee?.levelID ??
    selectedEmployee?.Level ??
    selectedEmployee?.level ??
    0
);

const showCompanyCar = employeeLevel >= 3;
const showFuelReimbursement = employeeLevel >= 3;



  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}

        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">
            Compensation &amp; Benefits
          </p>

          <div className="mt-1 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                CTC Calculation
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Calculate employee salary and Cost to Company based on the
                applicable salary structure.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Employee Selection */}

        <section className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Employee
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select an employee to calculate their CTC.
            </p>
          </div>

          <div className="p-6">
            <div className="max-w-xl">
              <label
                htmlFor="employee"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Select Employee
              </label>

              <select
                id="employee"
                value={employeeId}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                disabled={employeeLoading}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">
                  {employeeLoading ? "Loading employees..." : "Select an employee"}
                </option>

                {employees.map((emp) => {
                  const id = emp.employeeId ?? emp.EmployeeID;

                  const code =
                    emp.employeeCode ?? emp.EmployeeCode ?? "";

                  const name =
                    emp.employeeName ||
                    emp.EmployeeName ||
                    [
                      emp.firstName ?? emp.FirstName,
                      emp.lastName ?? emp.LastName,
                    ]
                      .filter(Boolean)
                      .join(" ") ||
                    "Employee";

                  return (
                    <option key={id} value={id}>
                      {code ? `${code} — ${name}` : `${id} — ${name}`}
                    </option>

                  );
                })}
              </select>
            </div>
          </div>
        </section>

        {/* Employee Details */}

        {contextLoading ? (
          <section className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="p-6 text-sm text-slate-500">
              Loading employee details...
            </div>
          </section>
        ) : employee ? (
          <section className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Employee Details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Employee information used for salary calculation.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4">
              <Detail label="Employee ID" value={employee.EmployeeID ?? employee.employeeId} />
              <Detail label="Employee Code" value={employee.EmployeeCode ?? employee.employeeCode} />
              <Detail label="Employee Name" value={employee.EmployeeName ?? employee.employeeName} />
              <Detail label="Grade" value={employee.Grade ?? employee.grade} />
              <Detail label="Grade Name" value={employee.GradeName ?? employee.gradeName} />
              <Detail label="Level" value={employee.Level ?? employee.level} />
              <Detail label="Designation ID" value={employee.DesignationID ?? employee.designationId} />
              <Detail label="Employment Type ID" value={employee.EmploymentTypeID ?? employee.employmentTypeId} />
              <Detail label="Location ID" value={employee.LocationID ?? employee.locationId} />
              <Detail label="Minimum Salary" value={formatCurrency(minimumSalary)} />
              <Detail
                label="Maximum Salary"
                value={maximumSalary > 0 ? formatCurrency(maximumSalary) : "No maximum configured"}
              />
            </div>
          </section>
        ) : null}

        {/* Company Accommodation */}
{employee && showCompanyAccommodation && (
  <div className="mb-6">
    <CompanyAccommodation
      value={accommodation}
      onChange={setAccommodation}
    />
  </div>
)}

{/* Company Car */}

{employee && showCompanyCar && (
  <section className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 px-6 py-4">
      <h2 className="text-lg font-semibold text-slate-900">
        Company Car
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Select whether the employee opts for a Company Car.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
      
      {/* Company Car */}

      <div>
        <label
          htmlFor="companyCar"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Company Car?
        </label>

        <select
          id="companyCar"
          value={vehicleOption.companyCar}
          onChange={(e) => {
            const value = e.target.value;

            setVehicleOption({
              companyCar: value,
              carType: value === "Yes" ? vehicleOption.carType : "",
            });

            setSalary(null);
            setError("");
          }}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        >
          <option value="">Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>

      {/* Car Type */}

      {vehicleOption.companyCar === "Yes" && (
        <div>
          <label
            htmlFor="carType"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Car Type
          </label>

          <select
            id="carType"
            value={vehicleOption.carType}
            onChange={(e) => {
              setVehicleOption({
                ...vehicleOption,
                carType: e.target.value,
              });

              setSalary(null);
              setError("");
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Select Car Type</option>
            <option value="EV">EV</option>
            <option value="ICE">ICE</option>
            <option value="SHB">Strong Hybrid</option>
          </select>
        </div>
      )}
    </div>
  </section>
)}

{employee && showFuelReimbursement && (
  <section className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">

    <div className="border-b border-slate-200 px-6 py-4">
      <h2 className="text-lg font-semibold text-slate-900">
        Fuel Reimbursement
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Enter the eligible fuel usage for the employee.
      </p>
    </div>

    <div className="px-6 py-5">

      {/* Fuel Option */}
      <div className="mb-5">
        <label
          htmlFor="fuelOption"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Opt for Fuel Reimbursement?
        </label>

        <select
          id="fuelOption"
          value={fuelOption}
          onChange={(e) => {
            const value = e.target.value;

            setFuelOption(value);

            if (value !== "Yes") {
              setReimbursementInput((prev) => ({
                ...prev,
                fuel: {
                  ...prev.fuel,
                  eligibleLitres: "",
                },
              }));
            }
          }}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        >
          <option value="">Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>

      {/* Eligible Litres */}
      {fuelOption === "Yes" && (
        <div>
          <label
            htmlFor="eligibleLitres"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Eligible Litres
          </label>

          <input
            id="eligibleLitres"
            type="number"
            min="0"
            step="0.01"
            value={reimbursementInput.fuel.eligibleLitres}
            onChange={(e) =>
              setReimbursementInput((prev) => ({
                ...prev,
                fuel: {
                  ...prev.fuel,
                  eligibleLitres: e.target.value,
                },
              }))
            }
            placeholder="Enter eligible litres"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />

          <p className="mt-2 text-xs text-slate-400">
            Enter the eligible fuel quantity in litres.
          </p>
        </div>
      )}

    </div>
  </section>
)}





        {/* Effective Date */}

        <section className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Effective Date
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select the date for which the salary configuration should apply.
            </p>
          </div>

          <div className="p-6">
            <label
              htmlFor="effectiveDate"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Effective Date
            </label>

            <input
              id="effectiveDate"
              type="date"
              value={effectiveDate}
              onChange={(e) => handleEffectiveDateChange(e.target.value)}
              className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </section>

        {/* Salary */}

        <section className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Salary
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter the monthly Basic Salary proposed by HR.
            </p>
          </div>

          <div className="p-6">
            <div className="max-w-md">

              {employee && (
                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SalaryRange
                    label="Minimum Salary"
                    value={minimumSalary > 0 ? formatCurrency(minimumSalary) : "Not configured"}
                  />
                  <SalaryRange
                    label="Maximum Salary"
                    value={maximumSalary > 0 ? formatCurrency(maximumSalary) : "No maximum"}
                  />
                </div>
              )}

              <label
                htmlFor="basicSalary"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Basic Salary (per month)
              </label>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  ₹
                </span>

                <input
                  id="basicSalary"
                  type="text"
                  inputMode="numeric"
                  value={basicSalary}
                  onChange={(e) => handleBasicSalaryChange(e.target.value)}
                  placeholder="Enter Basic Salary"
                  disabled={!employee || contextLoading}
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-8 pr-3 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              {employee && minimumSalary > 0 && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-medium text-slate-700">
                    Allowed Basic Salary
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatCurrency(minimumSalary)}
                    {maximumSalary > 0 && ` to ${formatCurrency(maximumSalary)}`}
                    {" "}per month.
                  </p>
                </div>
              )}

              {!employee && (
                <p className="mt-2 text-xs text-slate-400">
                  Select an employee first to see the applicable salary range.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Error */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Salary Components */}

        <section className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Salary Components
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Applicable components returned by the CTC calculation engine.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Component</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 text-right font-medium">Monthly</th>
                  <th className="px-6 py-3 text-right font-medium">Annual</th>
                </tr>
              </thead>

              <tbody>
                {components.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400">
                      Calculate CTC to view salary components.
                    </td>
                  </tr>
                ) : (
                  components
  .filter(
    (component) =>
      component.componentCode !== "COA_COL" &&
      component.componentCode !== "COA/COL"
  )
  .map((component) => (
                    <tr
                      key={component.componentId ?? component.ComponentID}
                      className="border-t border-slate-200"
                    >
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {component.componentName ?? component.ComponentName ?? component.componentCode}
                      </td>

                      <td className="px-6 py-4">
  <div className="flex flex-col gap-1">
    <span
      className={
        component.calculationStatus === "Calculated"
          ? "text-sm font-medium text-green-600"
          : component.calculationStatus === "Input Required"
          ? "text-sm font-medium text-red-600"
          : component.calculationStatus === "Not Opted"
          ? "text-sm font-medium text-slate-500"
          : component.eligibilityStatus === "Not Eligible"
          ? "text-sm font-medium text-slate-400"
          : "text-sm text-slate-500"
      }
    >
      {component.calculationStatus ||
        component.eligibilityStatus ||
        "—"}
    </span>

    {component.reason && (
      <span className="text-xs text-red-500">
        {component.reason}
      </span>
    )}
  </div>
</td>

                      <td className="px-6 py-4 text-right text-slate-700">
                        {formatCurrency(
                          component.monthlyAmount ?? component.CalculatedAmount ?? 0
                        )}
                      </td>

                      <td className="px-6 py-4 text-right text-slate-700">
                        {formatCurrency(
                          component.annualizedAmount ?? component.AnnualizedAmount ?? 0
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Calculation Summary */}

        {salary && (
          <section className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Calculation Summary
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryCard label="Monthly Gross" value={formatCurrency(monthlyGross)} />
              <SummaryCard label="Annual Monthly Gross" value={formatCurrency(annualMonthlyGross)} />
              <SummaryCard label="Monthly Retirals" value={formatCurrency(monthlyRetirals)} />
              <SummaryCard label="Annual Retirals" value={formatCurrency(annualRetirals)} />
              <SummaryCard
                label="Current Monthly Gross + Retirals"
                value={formatCurrency(currentMonthlyGrossPlusRetirals)}
              />
              <SummaryCard
                label="Current Annual Gross + Retirals"
                value={formatCurrency(currentAnnualGrossPlusRetirals)}
              />
              <SummaryCard label="Annual Fixed" value={formatCurrency(annualFixed)} />
              <SummaryCard
                label="Fixed CTC"
                value={`${formatIndianNumber(fixedCTCInLakhs)} L`}
              />
              <SummaryCard
                label="Final CTC"
                value={`${formatIndianNumber(finalCTCInLakhs)} L`}
              />
            </div>
          </section>
        )}

        {/* CTC Summary */}

        {salary && (
          <section className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                CTC Summary
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
              <SummaryCard label="Monthly CTC" value={formatCurrency(monthlyCTC)} />
              <SummaryCard label="Annual CTC" value={formatCurrency(annualCTC)} />
            </div>
          </section>
        )}

        {/* Actions */}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={clearCalculation}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={calculateCTC}
            disabled={
              loading ||
              employeeLoading ||
              contextLoading ||
              !employee
            }
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Calculating..." : "Calculate CTC"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// Detail component
// ---------------------------------------------------------

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-800">
        {value ?? "—"}
      </p>
    </div>
  );
}

// ---------------------------------------------------------
// Salary Range component
// ---------------------------------------------------------

function SalaryRange({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-800">{value}</p>
      <p className="mt-1 text-xs text-slate-400">Per month</p>
    </div>
  );
}

// ---------------------------------------------------------
// Summary Card component
// ---------------------------------------------------------

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default CtcCalculation;
