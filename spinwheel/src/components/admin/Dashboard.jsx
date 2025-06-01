import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Ticket,
  Trophy,
  TrendingUp,
  Activity,
  Gift,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { tokenAPI, spinAPI, adminAPI } from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [stats, setStats] = useState({
    tokens: { total: 0, used: 0, expired: 0, active: 0 },
    spins: { total: 0, today: 0 },
    admins: { total: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isSuperAdmin } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [tokenStats, spinStats, adminStats] = await Promise.all([
        tokenAPI.getStats(),
        spinAPI.getStats(),
        isSuperAdmin()
          ? adminAPI.getAll().catch(() => ({ data: { admins: [] } }))
          : Promise.resolve({ data: { admins: [] } }),
      ]);

      setStats({
        tokens: tokenStats.data.stats,
        spins: {
          total: spinStats.data.totalSpins,
          today: 0, // คำนวณจากข้อมูลวันนี้
        },
        admins: {
          total: adminStats.data.admins.length,
        },
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success("อัปเดตข้อมูลแล้ว");
  };

  const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="admin-card hover-lift"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {loading ? "..." : value.toLocaleString()}
          </p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  const tokenUsagePercentage =
    stats.tokens.total > 0
      ? Math.round((stats.tokens.used / stats.tokens.total) * 100)
      : 0;

  const activeTokensPercentage =
    stats.tokens.total > 0
      ? Math.round((stats.tokens.active / stats.tokens.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ด</h1>
          <p className="text-gray-600 mt-1">ภาพรวมของระบบ SpinWheel</p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-primary"
        >
          <RefreshCw
            className={`w-5 h-5 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          อัปเดต
        </motion.button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Token ทั้งหมด"
          value={stats.tokens.total}
          icon={Ticket}
          color="bg-blue-500"
          description={`ใช้แล้ว ${stats.tokens.used} / ${stats.tokens.total}`}
        />

        <StatCard
          title="Token ที่ใช้งานได้"
          value={stats.tokens.active}
          icon={Activity}
          color="bg-green-500"
          description={`${activeTokensPercentage}% ของทั้งหมด`}
        />

        <StatCard
          title="การหมุนทั้งหมด"
          value={stats.spins.total}
          icon={Trophy}
          color="bg-yellow-500"
          description="ผลการหมุนทั้งหมด"
        />

        {isSuperAdmin() && (
          <StatCard
            title="ผู้ดูแลระบบ"
            value={stats.admins.total}
            icon={Users}
            color="bg-purple-500"
            description="รวม SuperAdmin"
          />
        )}
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Usage Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="admin-card"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">สถานะ Token</h3>
            <Ticket className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {/* Used Tokens */}
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ใช้แล้ว</span>
                <span className="font-semibold">{stats.tokens.used}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${tokenUsagePercentage}%` }}
                />
              </div>
            </div>

            {/* Active Tokens */}
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ใช้งานได้</span>
                <span className="font-semibold">{stats.tokens.active}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${activeTokensPercentage}%` }}
                />
              </div>
            </div>

            {/* Expired Tokens */}
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">หมดอายุ</span>
                <span className="font-semibold">{stats.tokens.expired}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="bg-gray-400 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      stats.tokens.total > 0
                        ? (stats.tokens.expired / stats.tokens.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="admin-card"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              การดำเนินการด่วน
            </h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-3">
            <button
              onClick={() => (window.location.href = "/admin/tokens")}
              className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <Ticket className="w-5 h-5 text-blue-600 mr-3" />
                <span className="font-medium text-blue-900">
                  สร้าง Token ใหม่
                </span>
              </div>
              <span className="text-blue-600">→</span>
            </button>

            <button
              onClick={() => (window.location.href = "/admin/prizes")}
              className="w-full flex items-center justify-between p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <Gift className="w-5 h-5 text-yellow-600 mr-3" />
                <span className="font-medium text-yellow-900">
                  จัดการรางวัล
                </span>
              </div>
              <span className="text-yellow-600">→</span>
            </button>

            <button
              onClick={() => (window.location.href = "/admin/results")}
              className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <Trophy className="w-5 h-5 text-green-600 mr-3" />
                <span className="font-medium text-green-900">ดูผลการหมุน</span>
              </div>
              <span className="text-green-600">→</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="admin-card"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">สถานะระบบ</h3>
          <div className="flex items-center text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium">ปกติ</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">อัปเดตล่าสุด</span>
            <span className="font-medium">
              {new Date().toLocaleString("th-TH")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">เวอร์ชัน</span>
            <span className="font-medium">v1.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">เซิร์ฟเวอร์</span>
            <span className="font-medium text-green-600">เชื่อมต่อแล้ว</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
