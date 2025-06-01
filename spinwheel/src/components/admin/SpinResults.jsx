import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Search,
  Download,
  RefreshCw,
  BarChart3,
  Calendar,
  User,
  Ticket,
  Gift,
} from "lucide-react";
import { spinAPI } from "../../utils/api";
import toast from "react-hot-toast";

const SpinResults = () => {
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({ totalSpins: 0, prizeDistribution: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadResults();
    loadStats();
  }, [filters]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const response = await spinAPI.getResults(filters);
      setResults(response.data.results);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลผลการหมุนได้");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await spinAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error("Error loading spin stats:", error);
    }
  };

  const exportResults = () => {
    const csvContent = [
      ["รหัส Token", "รางวัลที่ได้", "ตำแหน่งรางวัล", "วันที่หมุน", "สร้างโดย"],
      ...results.map((result) => [
        result.tokenCode,
        result.prize.name,
        result.prize.position,
        new Date(result.spunAt).toLocaleDateString("th-TH"),
        result.tokenCreatedBy,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `spin_results_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  const getPositionColor = (position) => {
    return position % 2 === 1 ? "#dc2626" : "#f59e0b";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">ผลการหมุนวงล้อ</h1>
          <p className="text-gray-600 mt-1">ประวัติการหมุนและสถิติรางวัล</p>
        </motion.div>

        <div className="flex space-x-3">
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={exportResults}
            className="btn bg-green-600 text-white hover:bg-green-700"
          >
            <Download className="w-5 h-5 mr-2" />
            Export
          </motion.button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="admin-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">การหมุนทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalSpins}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Trophy className="w-6 h-6 text-blue-600" />
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
              <p className="text-sm text-gray-600">รางวัลที่ออกมากที่สุด</p>
              {stats.prizeDistribution.length > 0 && (
                <>
                  <p className="text-xl font-bold text-gray-900">
                    {
                      stats.prizeDistribution.reduce((max, prize) =>
                        prize.count > max.count ? prize : max
                      ).prizeName
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    {
                      stats.prizeDistribution.reduce((max, prize) =>
                        prize.count > max.count ? prize : max
                      ).count
                    }{" "}
                    ครั้ง
                  </p>
                </>
              )}
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Gift className="w-6 h-6 text-yellow-600" />
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
              <p className="text-sm text-gray-600">วันนี้</p>
              <p className="text-3xl font-bold text-green-600">
                {
                  results.filter(
                    (result) =>
                      new Date(result.spunAt).toDateString() ===
                      new Date().toDateString()
                  ).length
                }
              </p>
              <p className="text-sm text-gray-500">การหมุน</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Prize Distribution Chart */}
      {stats.prizeDistribution.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="admin-card"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              สถิติการออกรางวัล
            </h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {stats.prizeDistribution.map((prize, index) => {
              const percentage =
                stats.totalSpins > 0
                  ? (prize.count / stats.totalSpins) * 100
                  : 0;
              return (
                <div key={prize.position} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-3"
                        style={{
                          backgroundColor: getPositionColor(prize.position),
                        }}
                      ></div>
                      <span className="font-medium text-gray-900">
                        {prize.prizeName}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        (คาดหวัง: {prize.expectedProbability}%)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">
                        {prize.count}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: getPositionColor(prize.position),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="admin-card"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value, page: 1 })
                }
                placeholder="ค้นหา Token หรือรางวัล..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={loadResults}
            className="btn bg-gray-600 text-white hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            รีเฟรช
          </button>
        </div>
      </motion.div>

      {/* Results Table */}
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
        ) : results.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">ยังไม่มีผลการหมุน</p>
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
                    รางวัลที่ได้
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    ตำแหน่ง
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    วันที่หมุน
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Token สร้างโดย
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr
                    key={result.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <Ticket className="w-4 h-4 text-gray-400 mr-2" />
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {result.tokenCode}
                        </code>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-3"
                          style={{
                            backgroundColor: getPositionColor(
                              result.prize.position
                            ),
                          }}
                        ></div>
                        <span className="font-medium text-gray-900">
                          {result.prize.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        ช่องที่ {result.prize.position}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {new Date(result.spunAt).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          {result.tokenCreatedBy}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
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
    </div>
  );
};

export default SpinResults;
