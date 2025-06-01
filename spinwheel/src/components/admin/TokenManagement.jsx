import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Copy,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { tokenAPI } from "../../utils/api";
import toast from "react-hot-toast";

const TokenManagement = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadTokens();
    loadStats();
  }, [filters]);

  const loadTokens = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        status: filters.status === "all" ? undefined : filters.status,
      };
      const response = await tokenAPI.getAll(params);
      setTokens(response.data.tokens);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูล Token ได้");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await tokenAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error("Error loading token stats:", error);
    }
  };

  const handleCreateTokens = async () => {
    if (quantity < 1 || quantity > 100) {
      toast.error("จำนวน Token ต้องอยู่ระหว่าง 1-100");
      return;
    }

    try {
      setCreating(true);
      const response = await tokenAPI.create(quantity);
      toast.success(`สร้าง ${quantity} Token สำเร็จ`);
      setShowCreateModal(false);
      setQuantity(1);
      loadTokens();
      loadStats();
    } catch (error) {
      console.error("Create tokens error:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteExpired = async () => {
    if (!confirm("คุณต้องการลบ Token ที่หมดอายุทั้งหมดหรือไม่?")) {
      return;
    }

    try {
      setDeleting(true);
      await tokenAPI.deleteExpired();
      toast.success("ลบ Token ที่หมดอายุแล้ว");
      loadTokens();
      loadStats();
    } catch (error) {
      console.error("Delete expired tokens error:", error);
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("คัดลอกแล้ว");
  };

  const exportTokens = () => {
    const csvContent = [
      ["รหัส Token", "สถานะ", "วันที่สร้าง", "วันหมดอายุ", "สร้างโดย"],
      ...tokens.map((token) => [
        token.code,
        getStatusText(token.status),
        new Date(token.createdAt).toLocaleDateString("th-TH"),
        new Date(token.expiresAt).toLocaleDateString("th-TH"),
        token.createdBy,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `tokens_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getStatusText = (status) => {
    switch (status) {
      case "used":
        return "ใช้แล้ว";
      case "expired":
        return "หมดอายุ";
      case "active":
        return "ใช้งานได้";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "used":
        return "bg-red-100 text-red-800 border-red-200";
      case "expired":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "used":
        return CheckCircle;
      case "expired":
        return XCircle;
      case "active":
        return Clock;
      default:
        return Clock;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">จัดการ Token</h1>
          <p className="text-gray-600 mt-1">
            สร้างและจัดการ Token สำหรับลูกค้า
          </p>
        </motion.div>

        <div className="flex space-x-3">
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            สร้าง Token
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="admin-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total || 0}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="admin-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ใช้งานได้</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.active || 0}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="admin-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ใช้แล้ว</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.used || 0}
              </p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="admin-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">หมดอายุ</p>
              <p className="text-2xl font-bold text-gray-600">
                {stats.expired || 0}
              </p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Clock className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters and Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="admin-card"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value, page: 1 })
                }
                placeholder="ค้นหา Token..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value, page: 1 })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="active">ใช้งานได้</option>
              <option value="used">ใช้แล้ว</option>
              <option value="expired">หมดอายุ</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={exportTokens}
              className="btn bg-green-600 text-white hover:bg-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>

            <button
              onClick={handleDeleteExpired}
              disabled={deleting || stats.expired === 0}
              className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? (
                <div className="loading-spin w-4 h-4 mr-2"></div>
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              ลบที่หมดอายุ
            </button>

            <button
              onClick={loadTokens}
              className="btn bg-gray-600 text-white hover:bg-gray-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              รีเฟรช
            </button>
          </div>
        </div>
      </motion.div>

      {/* Token List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="admin-card"
      >
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="loading-spin w-8 h-8"></div>
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">ไม่พบ Token</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    รหัส Token
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    สถานะ
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    วันที่สร้าง
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    วันหมดอายุ
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    สร้างโดย
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token, index) => {
                  const StatusIcon = getStatusIcon(token.status);
                  return (
                    <tr
                      key={token.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                            {token.code}
                          </code>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            token.status
                          )}`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {getStatusText(token.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(token.createdAt).toLocaleDateString("th-TH")}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(token.expiresAt).toLocaleDateString("th-TH")}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">
                            {token.createdBy}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => copyToClipboard(token.code)}
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                          title="คัดลอก"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              แสดง {(pagination.page - 1) * pagination.limit + 1} -{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              จาก {pagination.total} รายการ
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  setFilters({ ...filters, page: pagination.page - 1 })
                }
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                ก่อนหน้า
              </button>
              <button
                onClick={() =>
                  setFilters({ ...filters, page: pagination.page + 1 })
                }
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Create Token Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              สร้าง Token ใหม่
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวน Token ที่ต้องการสร้าง
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Token จะมีอายุการใช้งาน 2 วันนับจากวันที่สร้าง
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreateTokens}
                disabled={creating}
                className="btn-primary disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <div className="loading-spin w-4 h-4 mr-2"></div>
                    กำลังสร้าง...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    สร้าง
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TokenManagement;
