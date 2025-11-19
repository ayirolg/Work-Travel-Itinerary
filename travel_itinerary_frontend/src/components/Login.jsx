import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";


const LoginPage = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store tokens in localStorage
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // alert("Login successful! Redirecting to dashboard...");
        // // Here you would typically redirect to the dashboard
        // // window.location.href = '/dashboard';
        navigate('/dashboard');
      } else {
        setError(data.detail || data.error || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error('Login error:', error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="d-flex justify-content-center align-items-center bg-white" style={{ minHeight: "100vh" }}>
      <div className="w-100" style={{ maxWidth: "420px" }}>
        
        {/* Logo + Title */}
        <div className="text-center mb-4">
          <div className="rounded-circle mx-auto d-flex justify-content-center align-items-center mb-3"
            style={{ width: "65px", height: "65px", backgroundColor: "#336699" }}>
            <svg className="text-white" width="30" height="30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="fw-bold" style={{ color: "#336699" }}>Work Travel Portal</h2>
          <p className="text-secondary">Employee Itinerary Management System</p>
        </div>

        {/* Login Card */}
        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <h4 className="fw-semibold mb-3 text-dark">Sign In</h4>

            {error && (
              <div className="alert alert-danger d-flex align-items-start p-2">
                <AlertCircle className="me-2 mt-1" size={18} />
                <span className="small">{error}</span>
              </div>
            )}

            {/* Username */}
            <div className="mb-3">
              <label className="form-label">Username or Email</label>
              <input type="text" name="username" value={formData.username}
                onChange={handleChange} onKeyPress={handleKeyPress}
                className="form-control"
                placeholder="Enter your username or email"
              />
            </div>

            {/* Password */}
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input type="password" name="password" value={formData.password}
                onChange={handleChange} onKeyPress={handleKeyPress}
                className="form-control"
                placeholder="Enter your password"
              />
            </div>

            {/* Remember + Forgot */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <input type="checkbox" className="form-check-input me-2" />
                <small>Remember me</small>
              </div>
              <button className="btn btn-link p-0 small" style={{ color: "#336699" }}>
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <button className="btn w-100 text-white fw-semibold"
              style={{ backgroundColor: "#336699" }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </div>

        {/* <p className="text-center text-secondary small mt-3">
          Need help? <button className="btn btn-link p-0 small" style={{ color: "#336699" }}>Contact IT Support</button>
        </p>

        <p className="text-center text-secondary small mt-2">
          © 2025 Work Travel Portal. All rights reserved.
        </p> */}

      </div>
    </div>
  );
};

export default LoginPage;
