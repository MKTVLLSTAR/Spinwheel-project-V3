import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Public Components
import SpinWheel from "./components/SpinWheel";

// Admin Components
import AdminLogin from "./components/admin/Login";
import AdminLayout from "./components/admin/Layout";
import Dashboard from "./components/admin/Dashboard";
import PrizeManagement from "./components/admin/PrizeManagement";
import TokenManagement from "./components/admin/TokenManagement";
import SpinResults from "./components/admin/SpinResults";
import UserManagement from "./components/admin/UserManagement";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<SpinWheel />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={<Navigate to="/admin/dashboard" replace />}
              />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="prizes" element={<PrizeManagement />} />
              <Route path="tokens" element={<TokenManagement />} />
              <Route path="results" element={<SpinResults />} />
              <Route
                path="users"
                element={
                  <ProtectedRoute requireSuperAdmin={true}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
                borderRadius: "8px",
                fontSize: "14px",
                maxWidth: "500px",
              },
              success: {
                style: {
                  background: "#10b981",
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#10b981",
                },
              },
              error: {
                style: {
                  background: "#ef4444",
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#ef4444",
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
