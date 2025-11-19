import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./components/Login";
import EmployeeDashboard from "./components/Dashboard";
import CreateItinerary from "./components/CreateItinerary/createItinerary"; // adjust path/filename as needed

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<EmployeeDashboard />} />
        <Route path="/create-itinerary" element={<CreateItinerary />} />
      </Routes>
    </Router>
  );
}

export default App;