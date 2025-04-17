import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import Homepage from "./components/Homepage";
import LoginPage from "./components/Loginpage";
import Candidateform from "./components/Candidateform";
import AdminDashboard from "./components/AdminDashboard";
import Registerform from "./components/Registerform";
import JobList from "./components/Joblist";
import HrPostCreate from "./components/Hrpostcreate";
import PanelDashboard from "./components/paneldashboard";
import MCQPanelInterface from "./components/McqQuestion"; // Import MCQ Panel Interface
import ApplyJob from "./components/ApplyJob"; // Import ApplyJob component

const FullLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
    <Footer />
  </>
);

const NavOnlyLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const userRole = localStorage.getItem("userRole");

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole?.toLowerCase())) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <FullLayout>
              <Homepage />
            </FullLayout>
          }
        />

        {/* Job List Page */}
        <Route
          path="/jobs"
          element={
            <NavOnlyLayout>
              <JobList />
            </NavOnlyLayout>
          }
        />

        {/* Candidate Form with Job Details */}
        <Route
          path="/apply/:id"
          element={
            <NavOnlyLayout>
              <ApplyJob />
            </NavOnlyLayout>
          }
        />

        <Route
          path="/candidateform"
          element={
            <NavOnlyLayout>
              <Candidateform />
            </NavOnlyLayout>
          }
        />

        <Route path="/register" element={<Registerform />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Admin Dashboard - Restricted to Admins */}
        <Route path="/admindashboard" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* HR Post Creation - Restricted to HR */}
        <Route path="/hrpost" element={
          <ProtectedRoute allowedRoles={["hr"]}>
            <HrPostCreate />
          </ProtectedRoute>
        } />

        {/* Panel Dashboard - Restricted to Panel Members */}
        <Route path="/paneldashboard" element={
          <ProtectedRoute allowedRoles={["panel"]}>
            <PanelDashboard />
          </ProtectedRoute>
        } />

        {/* MCQ Panel Interface - Restricted to Panel Members */}
        <Route path="/mcq-panel" element={
          <ProtectedRoute allowedRoles={["panel"]}>
            <MCQPanelInterface />
          </ProtectedRoute>
        } />

        {/* Unauthorized Page */}
        <Route path="/unauthorized" element={
          <div className="flex items-center justify-center min-h-screen">
            <h1 className="text-2xl text-red-600">Unauthorized Access</h1>
          </div>
        } />

        {/* 404 Page */}
        <Route
          path="*"
          element={<div className="text-center text-xl p-10">404 - Page Not Found</div>}
        />
      </Routes>
    </Router>
  );
};

export default App;
