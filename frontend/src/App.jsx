import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import CtcCalculation from "./pages/CtcCalculation";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Dashboard />} />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/ctc-calculation"
          element={<CtcCalculation />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;