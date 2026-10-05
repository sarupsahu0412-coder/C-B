
function CompanyAccommodation({
  value,
  onChange,
}) {
  const accommodation = value || {
    companyAccommodation: "",
    accommodationType: "",
    rent: "",
    maintenance: "",
    hha: "",
  };

  const updateField = (field, fieldValue) => {
    onChange({
      ...accommodation,
      [field]: fieldValue,
    });
  };

  const handleAccommodationChange = (answer) => {
    onChange({
      companyAccommodation: answer,
      accommodationType: "",
      rent: "",
      maintenance: "",
      hha: "",
    });
  };

  const handleTypeChange = (type) => {
    onChange({
      ...accommodation,
      accommodationType: type,
      rent: "",
      maintenance: "",
      hha: "",
    });
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-xl font-semibold text-slate-900">
          Company Accommodation
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Select whether the employee receives company accommodation.
        </p>
      </div>

      <div className="space-y-6 p-6">
        {/* Company Accommodation Yes / No */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Company Accommodation
          </label>

          <select
            value={accommodation.companyAccommodation}
            onChange={(e) =>
              handleAccommodationChange(e.target.value)
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select Yes or No</option>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>

        {/* No accommodation: HRA applicable */}
        {accommodation.companyAccommodation === "No" && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="font-medium text-green-800">
              HRA is applicable
            </p>
            <p className="mt-1 text-sm text-green-700">
              HRA will be calculated by the CTC calculation engine
              according to the applicable salary rules.
            </p>
          </div>
        )}

        {/* Yes accommodation: select type */}
        {accommodation.companyAccommodation === "Yes" && (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Accommodation Type
              </label>

              <select
                value={accommodation.accommodationType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select accommodation type</option>
                <option value="CLA">CLA</option>
                <option value="COL">COL</option>
                <option value="Hostel">Hostel</option>
              </select>
            </div>

            {/* CLA: Rent and Maintenance */}
            {accommodation.accommodationType === "CLA" && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Company Accommodation Rent (per month)
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={accommodation.rent}
                    onChange={(e) => updateField("rent", e.target.value)}
                    placeholder="Enter rent"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Company Accommodation Maintenance (per month)
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={accommodation.maintenance}
                    onChange={(e) =>
                      updateField("maintenance", e.target.value)
                    }
                    placeholder="Enter maintenance"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Hostel: HHA */}
{accommodation.accommodationType === "Hostel" && (
  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">

    <p className="mt-1 text-lg font-semibold text-slate-900">
      HHA Selected
    </p>

    <p className="mt-1 text-xs text-slate-500">
      HHA amount will be determined automatically by the CTC calculation
      engine based on the configured salary rules.
    </p>
  </div>
)}

            {/* COL: Accommodation details to be resolved */}
{accommodation.accommodationType === "COL" && (
  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
    <p className="font-medium text-blue-800">
      COL selected
    </p>

    <p className="mt-1 text-sm text-blue-700">
      Company accommodation details and applicable costs
      will be determined according to the configured
      eligibility matrix.
    </p>
  </div>
)}

            {/* HRA is zero when company accommodation is provided */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="font-medium text-amber-800">
                HRA is not applicable
              </p>
              <p className="mt-1 text-sm text-amber-700">
                HRA will be zero when company accommodation is provided.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default CompanyAccommodation;
