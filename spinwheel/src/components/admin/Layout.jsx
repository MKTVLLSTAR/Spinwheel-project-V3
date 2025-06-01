import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  Users,
  Gift,
  Ticket,
  BarChart3,
  LogOut,
  Menu,
  X,
  Settings,
  Crown,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { admin, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const navigation = [
    { name: "แดชบอร์ด", href: "/admin/dashboard", icon: Home },
    { name: "จัดการรางวัล", href: "/admin/prizes", icon: Gift },
    { name: "จัดการ Token", href: "/admin/tokens", icon: Ticket },
    { name: "ผลการหมุน", href: "/admin/results", icon: BarChart3 },
    ...(isSuperAdmin()
      ? [{ name: "จัดการผู้ดูแล", href: "/admin/users", icon: Users }]
      : []),
  ];

  const NavLink = ({ item }) => {
    const isActive = location.pathname === item.href;

    return (
      <motion.a
        href={item.href}
        onClick={(e) => {
          e.preventDefault();
          navigate(item.href);
          setSidebarOpen(false);
        }}
        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
          isActive
            ? "bg-red-100 text-red-700 border-r-4 border-red-600"
            : "text-gray-700 hover:bg-gray-100"
        }`}
        whileHover={{ x: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <item.icon className="w-5 h-5 mr-3" />
        {item.name}
      </motion.a>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ x: sidebarOpen ? 0 : "-100%" }}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform lg:translate-x-0 lg:static lg:inset-0"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-yellow-600 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <span className="ml-2 text-xl font-bold gradient-text">
              SpinWheel
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Admin Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center">
              {isSuperAdmin() ? (
                <Crown className="w-6 h-6 text-white" />
              ) : (
                <Users className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-gray-900">
                {admin?.username}
              </p>
              <p className="text-xs text-gray-500">
                {isSuperAdmin() ? "Super Admin" : "Admin"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-4 space-y-2">
          {navigation.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-700 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            ออกจากระบบ
          </button>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-900">
              ระบบจัดการ SpinWheel
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString("th-TH")}
            </span>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
