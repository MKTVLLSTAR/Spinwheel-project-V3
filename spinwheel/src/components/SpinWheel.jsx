import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Gift, Trophy, Sparkles } from "lucide-react";
import { prizeAPI, tokenAPI, spinAPI } from "../utils/api";
import toast from "react-hot-toast";

const SpinWheel = () => {
  const [prizes, setPrizes] = useState([]);
  const [tokenCode, setTokenCode] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const wheelRef = useRef(null);

  useEffect(() => {
    loadPrizes();
  }, []);

  const loadPrizes = async () => {
    try {
      const response = await prizeAPI.getAll();
      setPrizes(response.data.prizes);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลรางวัลได้");
    }
  };

  const validateToken = async () => {
    if (!tokenCode.trim()) {
      toast.error("กรุณาใส่รหัส Token");
      return false;
    }

    try {
      setLoading(true);
      await tokenAPI.validate(tokenCode.trim());
      return true;
    } catch (error) {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSpin = async () => {
    const isValid = await validateToken();
    if (!isValid) return;

    try {
      setIsSpinning(true);
      setShowResult(false);

      // Call spin API
      const response = await spinAPI.spin(tokenCode.trim());
      const result = response.data.result;

      // Calculate rotation angle
      const spinAngle = result.spinAngle;

      // Apply spin animation
      if (wheelRef.current) {
        wheelRef.current.style.setProperty("--spin-degrees", `${spinAngle}deg`);
        wheelRef.current.classList.add("spinning");
      }

      // Show result after animation
      setTimeout(() => {
        setSpinResult(result);
        setShowResult(true);
        setIsSpinning(false);
        toast.success(`🎉 คุณได้รับ: ${result.prize.name}`);
      }, 4000);
    } catch (error) {
      setIsSpinning(false);
      console.error("Spin error:", error);
    }
  };

  const resetSpin = () => {
    setTokenCode("");
    setSpinResult(null);
    setShowResult(false);
    if (wheelRef.current) {
      wheelRef.current.classList.remove("spinning");
      wheelRef.current.style.setProperty("--spin-degrees", "0deg");
    }
  };

  const renderWheelSegment = (prize, index) => {
    const segmentAngle = 360 / 8;
    const rotation = index * segmentAngle;

    return (
      <div
        key={prize._id}
        className="prize-segment absolute w-full h-full"
        style={{
          transform: `rotate(${rotation}deg)`,
          background: index % 2 === 0 ? "#dc2626" : "#f59e0b",
          clipPath: "polygon(50% 50%, 50% 0%, 92.7% 37.5%)",
        }}
      >
        <div
          className="absolute text-white text-sm font-semibold text-center"
          style={{
            top: "25%",
            left: "65%",
            transform: "translateX(-50%)",
            fontSize: "12px",
            lineHeight: "1.2",
            maxWidth: "60px",
          }}
        >
          {prize.name}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4">
            🎲 SpinWheel
          </h1>
          <p className="text-lg md:text-xl text-gray-600">
            ใส่ Token เพื่อหมุนวงล้อและลุ้นรับรางวัล
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Wheel Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="wheel-container">
              {/* Wheel Pointer */}
              <div className="wheel-pointer"></div>

              {/* Main Wheel */}
              <div
                ref={wheelRef}
                className="relative w-full h-full rounded-full border-8 border-yellow-400 shadow-2xl"
                style={{ transformOrigin: "center" }}
              >
                {prizes.map((prize, index) => renderWheelSegment(prize, index))}
              </div>

              {/* Center Hub */}
              <div className="wheel-hub flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-red-800" />
              </div>

              {/* Spinning Overlay */}
              {isSpinning && (
                <div className="absolute inset-0 bg-black bg-opacity-20 rounded-full flex items-center justify-center">
                  <div className="text-white text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-2" />
                    <p className="text-lg font-semibold">กำลังหมุน...</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Control Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {!showResult ? (
              <div className="glass-effect rounded-2xl p-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">
                      รหัส Token
                    </label>
                    <input
                      type="text"
                      value={tokenCode}
                      onChange={(e) =>
                        setTokenCode(e.target.value.toUpperCase())
                      }
                      placeholder="ใส่รหัส Token ของคุณ"
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
                      disabled={isSpinning}
                      maxLength={12}
                    />
                  </div>

                  <button
                    onClick={handleSpin}
                    disabled={isSpinning || loading || !tokenCode.trim()}
                    className="w-full btn-primary text-xl py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        กำลังตรวจสอบ...
                      </>
                    ) : isSpinning ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        กำลังหมุน...
                      </>
                    ) : (
                      <>
                        <Gift className="w-6 h-6 mr-2" />
                        หมุนวงล้อ
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="glass-effect rounded-2xl p-8 text-center"
                >
                  <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    🎉 ยินดีด้วย!
                  </h2>
                  <p className="text-xl text-gray-600 mb-4">คุณได้รับรางวัล</p>
                  <div className="bg-gradient-to-r from-red-500 to-yellow-500 text-white rounded-lg p-4 mb-6">
                    <h3 className="text-2xl font-bold">
                      {spinResult?.prize?.name}
                    </h3>
                  </div>
                  <button onClick={resetSpin} className="btn-secondary">
                    หมุนใหม่
                  </button>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Prize List */}
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Gift className="w-6 h-6 mr-2" />
                รางวัลทั้งหมด
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {prizes.map((prize, index) => (
                  <div
                    key={prize._id}
                    className="flex items-center space-x-2 p-2 rounded-lg"
                    style={{
                      backgroundColor: index % 2 === 0 ? "#fee2e2" : "#fef3c7",
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor:
                          index % 2 === 0 ? "#dc2626" : "#f59e0b",
                      }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">
                      {prize.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SpinWheel;
