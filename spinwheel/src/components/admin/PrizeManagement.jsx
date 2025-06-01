import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gift, Save, RefreshCw, Palette, Percent } from "lucide-react";
import { prizeAPI } from "../../utils/api";
import toast from "react-hot-toast";

const PrizeManagement = () => {
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [totalProbability, setTotalProbability] = useState(0);

  useEffect(() => {
    loadPrizes();
  }, []);

  useEffect(() => {
    // Calculate total probability whenever prizes change
    const total = prizes.reduce(
      (sum, prize) => sum + (parseFloat(prize.probability) || 0),
      0
    );
    setTotalProbability(total);
  }, [prizes]);

  const loadPrizes = async () => {
    try {
      setLoading(true);
      const response = await prizeAPI.getAll();
      const sortedPrizes = response.data.prizes.sort(
        (a, b) => a.position - b.position
      );
      setPrizes(sortedPrizes);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลรางวัลได้");
    } finally {
      setLoading(false);
    }
  };

  const handlePrizeChange = (index, field, value) => {
    const updatedPrizes = [...prizes];
    updatedPrizes[index] = {
      ...updatedPrizes[index],
      [field]: field === "probability" ? parseFloat(value) || 0 : value,
    };
    setPrizes(updatedPrizes);
  };

  const handleSave = async () => {
    // Validation
    if (Math.abs(totalProbability - 100) > 0.01) {
      toast.error(
        `โปรดปรับให้ผรวมความน่าจะเป็น = 100% (ปัจจุบัน: ${totalProbability.toFixed(
          2
        )}%)`
      );
      return;
    }

    const emptyPrizes = prizes.filter(
      (prize) => !prize.name || prize.name.trim() === ""
    );
    if (emptyPrizes.length > 0) {
      toast.error("กรุณาใส่ชื่อรางวัลให้ครบทุกช่อง");
      return;
    }

    try {
      setSaving(true);
      await prizeAPI.updateAll(prizes);
      toast.success("บันทึกรางวัลสำเร็จ");
    } catch (error) {
      console.error("Save prizes error:", error);
    } finally {
      setSaving(false);
    }
  };

  const resetProbabilities = () => {
    const updatedPrizes = prizes.map((prize) => ({
      ...prize,
      probability: 12.5,
    }));
    setPrizes(updatedPrizes);
    toast.success("รีเซ็ตความน่าจะเป็นเป็น 12.5% เท่าๆ กัน");
  };

  const colors = ["#dc2626", "#f59e0b"]; // Red and Gold alternating

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spin w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">จัดการรางวัล</h1>
          <p className="text-gray-600 mt-1">
            ตั้งค่าชื่อรางวัลและความน่าจะเป็นในการออก
          </p>
        </motion.div>

        <div className="flex space-x-3">
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={resetProbabilities}
            className="btn bg-gray-600 text-white hover:bg-gray-700"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            รีเซ็ต %
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            onClick={handleSave}
            disabled={saving || Math.abs(totalProbability - 100) > 0.01}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="loading-spin w-5 h-5 mr-2"></div>
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                บันทึก
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Probability Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`admin-card ${
          Math.abs(totalProbability - 100) > 0.01
            ? "border-2 border-red-500 bg-red-50"
            : "border-2 border-green-500 bg-green-50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Percent className="w-6 h-6 text-gray-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                รวมความน่าจะเป็น: {totalProbability.toFixed(2)}%
              </h3>
              <p
                className={`text-sm ${
                  Math.abs(totalProbability - 100) > 0.01
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {Math.abs(totalProbability - 100) > 0.01
                  ? `ต้องเป็น 100% เท่านั้น (ต่าง ${(
                      100 - totalProbability
                    ).toFixed(2)}%)`
                  : "ถูกต้องแล้ว ✓"}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div
              className={`text-3xl font-bold ${
                Math.abs(totalProbability - 100) > 0.01
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {totalProbability.toFixed(1)}%
            </div>
          </div>
        </div>
      </motion.div>

      {/* Prize List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {prizes.map((prize, index) => (
          <motion.div
            key={prize._id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="admin-card hover-lift"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div
                  className="w-8 h-8 rounded-full mr-3"
                  style={{ backgroundColor: colors[index % 2] }}
                ></div>
                <h3 className="text-lg font-semibold text-gray-900">
                  ช่องที่ {prize.position}
                </h3>
              </div>
              <Gift className="w-5 h-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              {/* Prize Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อรางวัล
                </label>
                <input
                  type="text"
                  value={prize.name || ""}
                  onChange={(e) =>
                    handlePrizeChange(index, "name", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                  placeholder={`รางวัลที่ ${prize.position}`}
                />
              </div>

              {/* Probability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ความน่าจะเป็น (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={prize.probability || ""}
                    onChange={(e) =>
                      handlePrizeChange(index, "probability", e.target.value)
                    }
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <span className="absolute right-3 top-2 text-gray-500 text-sm">
                    %
                  </span>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">ตัวอย่าง:</span>
                  <span className="font-medium">
                    {prize.probability?.toFixed(1)}% ของการหมุน
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(prize.probability || 0, 100)}%`,
                      backgroundColor: colors[index % 2],
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Wheel Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="admin-card"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">ตัวอย่างวงล้อ</h3>
          <Palette className="w-5 h-5 text-gray-400" />
        </div>

        <div className="flex justify-center">
          <div className="relative w-64 h-64">
            {/* Wheel segments */}
            <div className="relative w-full h-full rounded-full border-4 border-yellow-400 overflow-hidden">
              {prizes.map((prize, index) => {
                const rotation = index * 45; // 360/8 = 45 degrees per segment
                return (
                  <div
                    key={index}
                    className="absolute w-full h-full"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      background: colors[index % 2],
                      clipPath: "polygon(50% 50%, 50% 0%, 92.7% 37.5%)",
                    }}
                  >
                    <div
                      className="absolute text-white text-xs font-medium text-center"
                      style={{
                        top: "25%",
                        left: "65%",
                        transform: "translateX(-50%)",
                        fontSize: "10px",
                        lineHeight: "1.2",
                        maxWidth: "40px",
                      }}
                    >
                      {prize.name || `รางวัล ${index + 1}`}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Center hub */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full border-4 border-red-600 flex items-center justify-center">
              <Gift className="w-6 h-6 text-red-800" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PrizeManagement;
