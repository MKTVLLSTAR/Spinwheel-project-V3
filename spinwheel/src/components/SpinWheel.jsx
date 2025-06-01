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

      // คำนวณมุมการหมุนให้รางวัลมาตรงกลางบน
      // Position 1 = 0°, Position 2 = 45°, Position 3 = 90°, etc.
      const segmentAngle = 45; // 360 / 8 = 45 degrees per segment
      const prizePosition = result.prize.position;

      // คำนวณมุมเป้าหมาย (รางวัลจะมาอยู่ที่ตำแหน่ง 12 นาฬิกา)
      // เนื่องจาก position 1 อยู่ที่ 12 นาฬิกาอยู่แล้ว เราต้องหมุนให้ prize ที่ต้องการมาอยู่ที่ตำแหน่งนั้น
      const targetAngle = -(prizePosition - 1) * segmentAngle;

      // เพิ่มการหมุนหลายรอบเพื่อให้ดูสมจริง (5-8 รอบ)
      const extraRotations = (5 + Math.random() * 3) * 360;

      // มุมการหมุนสุดท้าย
      const finalAngle = extraRotations + targetAngle;

      // Apply spin animation
      if (wheelRef.current) {
        wheelRef.current.style.transform = `rotate(${finalAngle}deg)`;
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
      wheelRef.current.style.transform = "rotate(0deg)";
    }
  };

  const renderWheelSegment = (prize, index) => {
    const segmentAngle = 45; // 360 / 8 = 45 degrees
    const rotation = index * segmentAngle;
    const color = index % 2 === 0 ? "#dc2626" : "#f59e0b";

    // Create proper slice using SVG path
    const startAngle = (index * segmentAngle - 90) * (Math.PI / 180); // Start from top
    const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);

    const largeArcFlag = segmentAngle > 180 ? 1 : 0;
    const radius = 150; // Half of wheel size (300px / 2)
    const centerX = 150;
    const centerY = 150;

    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      "Z",
    ].join(" ");

    // Text position
    const textAngle = (startAngle + endAngle) / 2;
    const textRadius = radius * 0.7;
    const textX = centerX + textRadius * Math.cos(textAngle);
    const textY = centerY + textRadius * Math.sin(textAngle);

    return (
      <g key={prize._id || index}>
        <path d={pathData} fill={color} stroke="#ffffff" strokeWidth="2" />
        <text
          x={textX}
          y={textY}
          fill="white"
          fontSize="12"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(${rotation + 22.5}, ${textX}, ${textY})`}
        >
          {prize.name}
        </text>
      </g>
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
            className="relative flex justify-center"
          >
            <div className="wheel-container relative">
              {/* Main Wheel - SVG */}
              <div
                ref={wheelRef}
                className="relative w-80 h-80 transition-transform duration-1000 ease-out"
                style={{ transformOrigin: "center center" }}
              >
                <svg
                  width="320"
                  height="320"
                  viewBox="0 0 300 300"
                  className="w-full h-full drop-shadow-2xl"
                >
                  {/* Outer border */}
                  <circle
                    cx="150"
                    cy="150"
                    r="148"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="4"
                  />

                  {/* Wheel segments */}
                  {prizes.map((prize, index) =>
                    renderWheelSegment(prize, index)
                  )}

                  {/* Inner circle */}
                  <circle
                    cx="150"
                    cy="150"
                    r="25"
                    fill="url(#goldGradient)"
                    stroke="#dc2626"
                    strokeWidth="3"
                  />

                  {/* Gradient definitions */}
                  <defs>
                    <linearGradient
                      id="goldGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Spinning Overlay */}
                {isSpinning && (
                  <div className="absolute inset-0 bg-black bg-opacity-20 rounded-full flex items-center justify-center z-10">
                    <div className="text-white text-center">
                      <Loader2 className="w-12 h-12 animate-spin mx-auto mb-2" />
                      <p className="text-lg font-semibold">กำลังหมุน...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Wheel Pointer - แหลมลง */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 z-20">
                <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[35px] border-l-transparent border-r-transparent border-t-red-600 filter drop-shadow-lg"></div>
              </div>

              {/* Center decoration */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-4 border-red-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-red-800" />
                </div>
              </div>
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
