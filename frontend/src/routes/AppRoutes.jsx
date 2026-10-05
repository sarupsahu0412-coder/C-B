import { Routes, Route, Navigate } from "react-router-dom"
import Dashboard from "../pages/Dashboard"

function AppRoutes() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Default route */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AppRoutes