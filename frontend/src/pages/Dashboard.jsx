import { useNavigate } from "react-router-dom"

function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">
            Compensation & Benefits
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage employee compensation, salary and benefits.
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* CTC Calculation Card */}
          <div
            onClick={() => navigate("/ctc-calculation")}
            className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          >

            {/* Card Header */}
            <div className="flex items-start justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.8"
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v12m-3-3.5h6m-6-5h6M7.5 3.75h9A2.25 2.25 0 0 1 18.75 6v12a2.25 2.25 0 0 1-2.25 2.25h-9A2.25 2.25 0 0 1 5.25 18V6A2.25 2.25 0 0 1 7.5 3.75Z"
                  />
                </svg>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition group-hover:bg-slate-100 group-hover:text-slate-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m9 5 7 7-7 7"
                  />
                </svg>
              </div>

            </div>

            {/* Card Content */}
            <div className="mt-6">

              <h2 className="text-xl font-semibold text-slate-900">
                CTC Calculation
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Calculate employee Cost to Company based on grade,
                salary structure and applicable components.
              </p>

            </div>

            {/* Card Footer */}
            <div className="mt-6 border-t border-slate-100 pt-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Includes
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    Salary • Components • CTC
                  </p>
                </div>

                <span className="text-sm font-semibold text-slate-900 transition group-hover:translate-x-1">
                  Open →
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  )
}

export default Dashboard