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

      // คำนวณการหมุนให้แม่นยำที่สุด
      const prizePosition = result.prize.position;

      // แต่ละ segment มีขนาด 45 degrees
      // Position 1 ควรอยู่ที่ 0 degrees (12 นาฬิกา)
      // Position 2 ควรอยู่ที่ 45 degrees
      // Position 3 ควรอยู่ที่ 90 degrees
      // และต่อไป...

      // คำนวณมุมปัจจุบันของรางวัลที่ได้
      const prizeCurrentAngle = (prizePosition - 1) * 45;

      // เราต้องการให้รางวัลมาอยู่ที่ 0 degrees (ใต้เข็ม)
      // ดังนั้นต้องหมุน -prizeCurrentAngle
      const targetAngle = -prizeCurrentAngle;

      // เพิ่มการหมุนหลายรอบเพื่อให้ดูสมจริง (8-12 รอบ)
      const extraRotations = (8 + Math.random() * 4) * 360;

      // มุมการหมุนสุดท้าย
      const finalAngle = extraRotations + targetAngle;

      console.log("Prize Position:", prizePosition);
      console.log("Prize Current Angle:", prizeCurrentAngle);
      console.log("Target Angle:", targetAngle);
      console.log("Final Angle:", finalAngle);

      // Apply smooth spin animation
      if (wheelRef.current) {
        wheelRef.current.style.transition =
          "transform 6s cubic-bezier(0.15, 0, 0.25, 1)";
        wheelRef.current.style.transform = `rotate(${finalAngle}deg)`;
      }

      // Show result after animation (increased duration)
      setTimeout(() => {
        setSpinResult(result);
        setShowResult(true);
        setIsSpinning(false);
        toast.success(`🎉 คุณได้รับ: ${result.prize.name}`);
      }, 6000); // เพิ่มเป็น 6 วินาที
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
      // Reset transition และ transform
      wheelRef.current.style.transition = "none";
      wheelRef.current.style.transform = "rotate(0deg)";

      // Force reflow เพื่อให้ browser apply การเปลี่ยนแปลง
      wheelRef.current.offsetHeight;

      // เปิด transition กลับ
      setTimeout(() => {
        if (wheelRef.current) {
          wheelRef.current.style.transition =
            "transform 6s cubic-bezier(0.15, 0, 0.25, 1)";
        }
      }, 50);
    }
  };

  const renderWheelSegment = (prize, index) => {
    const segmentAngle = 45; // 360 / 8 = 45 degrees
    const color = index % 2 === 0 ? "#1e3a8a" : "#7c3aed"; // Space blue and purple

    // Calculate precise angles for each segment
    // Position 1 should be at top (12 o'clock), Position 2 at 1:30, etc.
    const startAngle = (index * segmentAngle - 90 - 22.5) * (Math.PI / 180); // Start from top, offset by half segment
    const endAngle = ((index + 1) * segmentAngle - 90 - 22.5) * (Math.PI / 180);

    const largeArcFlag = segmentAngle > 180 ? 1 : 0;
    const radius = 200; // Increased radius for bigger wheel
    const centerX = 250;
    const centerY = 250;

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

    // Text position (middle of segment)
    const textAngle = (startAngle + endAngle) / 2;
    const textRadius = radius * 0.7;
    const textX = centerX + textRadius * Math.cos(textAngle);
    const textY = centerY + textRadius * Math.sin(textAngle);

    return (
      <g key={prize._id || index}>
        {/* Segment with gradient */}
        <defs>
          <linearGradient
            id={`segmentGradient${index}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={color} />
            <stop
              offset="100%"
              stopColor={index % 2 === 0 ? "#1e40af" : "#8b5cf6"}
            />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d={pathData}
          fill={`url(#segmentGradient${index})`}
          stroke="#ffffff"
          strokeWidth="3"
          filter="url(#glow)"
        />
        <text
          x={textX}
          y={textY}
          fill="white"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
            filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.8))",
          }}
        >
          {prize.name}
        </text>
        {/* Position indicator for debugging */}
        <text
          x={textX}
          y={textY + 20}
          fill="#fbbf24"
          fontSize="10"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {prize.position}
        </text>
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Space background with stars */}
      <div className="absolute inset-0">
        {/* Stars */}
        <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-yellow-300 rounded-full animate-pulse"></div>
        <div className="absolute top-40 left-1/4 w-1 h-1 bg-blue-300 rounded-full animate-pulse"></div>
        <div className="absolute top-60 right-1/3 w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <div className="absolute bottom-40 left-20 w-1 h-1 bg-purple-300 rounded-full animate-pulse"></div>
        <div className="absolute bottom-60 right-10 w-1 h-1 bg-yellow-200 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 left-10 w-1 h-1 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-blue-200 rounded-full animate-pulse"></div>

        {/* Nebula effect */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-900/20 via-transparent to-blue-900/20"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10 p-4">
        {/* Increased max-width for larger wheel */}
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
            🚀 SpinWheel Galaxy
          </h1>
          <p className="text-lg md:text-xl text-gray-300">
            ใส่ Token เพื่อหมุนวงล้อในจักรวาลและลุ้นรับรางวัล
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
              {/* Main Wheel - SVG ขนาดใหญ่ */}
              <div
                ref={wheelRef}
                className="relative w-[500px] h-[500px] transition-transform duration-1000 ease-out"
                style={{ transformOrigin: "center center" }}
              >
                <svg
                  width="500"
                  height="500"
                  viewBox="0 0 500 500"
                  className="w-full h-full drop-shadow-2xl"
                >
                  {/* Space background circle */}
                  <circle
                    cx="250"
                    cy="250"
                    r="248"
                    fill="url(#spaceGradient)"
                    stroke="#fbbf24"
                    strokeWidth="4"
                  />

                  {/* Wheel segments */}
                  {prizes.map((prize, index) =>
                    renderWheelSegment(prize, index)
                  )}

                  {/* Inner circle with space theme */}
                  <circle
                    cx="250"
                    cy="250"
                    r="35"
                    fill="url(#centerGradient)"
                    stroke="#fbbf24"
                    strokeWidth="4"
                  />

                  {/* Gradient definitions */}
                  <defs>
                    <radialGradient
                      id="spaceGradient"
                      cx="50%"
                      cy="50%"
                      r="50%"
                    >
                      <stop offset="0%" stopColor="#1e1b4b" />
                      <stop offset="100%" stopColor="#0f0f23" />
                    </radialGradient>
                    <radialGradient
                      id="centerGradient"
                      cx="50%"
                      cy="50%"
                      r="50%"
                    >
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </radialGradient>
                  </defs>
                </svg>

                {/* Spinning Overlay */}
                {isSpinning && (
                  <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center z-10">
                    <div className="text-white text-center">
                      <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-yellow-400" />
                      <p className="text-xl font-semibold">🚀 กำลังหมุน...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Wheel Pointer - ธีมอวกาศ */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 z-20">
                <div className="relative">
                  {/* Rocket pointer */}
                  <div className="w-0 h-0 border-l-[25px] border-r-[25px] border-t-[45px] border-l-transparent border-r-transparent border-t-yellow-400 filter drop-shadow-lg"></div>
                  {/* Rocket flame effect */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 translate-y-1">
                    <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse opacity-80"></div>
                  </div>
                </div>
              </div>

              {/* Center decoration - Planet theme */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border-4 border-yellow-300 flex items-center justify-center shadow-2xl animate-pulse">
                  <Sparkles className="w-8 h-8 text-yellow-900" />
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
              <div className="bg-gradient-to-br from-slate-800/80 to-purple-900/80 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30">
                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-semibold text-purple-200 mb-2">
                      🎫 รหัส Token
                    </label>
                    <input
                      type="text"
                      value={tokenCode}
                      onChange={(e) =>
                        setTokenCode(e.target.value.toUpperCase())
                      }
                      placeholder="ใส่รหัส Token ของคุณ"
                      className="w-full px-4 py-3 text-lg bg-slate-700/80 border-2 border-purple-400/50 rounded-lg focus:border-yellow-400 focus:outline-none transition-colors text-white placeholder-gray-400"
                      disabled={isSpinning}
                      maxLength={12}
                    />
                  </div>

                  <button
                    onClick={handleSpin}
                    disabled={isSpinning || loading || !tokenCode.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-xl py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin mr-2 inline" />
                        🔍 กำลังตรวจสอบ...
                      </>
                    ) : isSpinning ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin mr-2 inline" />
                        🚀 กำลังหมุน...
                      </>
                    ) : (
                      <>
                        <Gift className="w-6 h-6 mr-2 inline" />
                        🌟 หมุนวงล้อจักรวาล
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
                  className="bg-gradient-to-br from-yellow-600/90 to-orange-600/90 backdrop-blur-lg rounded-2xl p-8 text-center border border-yellow-400/50"
                >
                  <Trophy className="w-16 h-16 text-yellow-200 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-white mb-2">
                    🎉 ยินดีด้วย!
                  </h2>
                  <p className="text-xl text-yellow-100 mb-4">
                    คุณได้รับรางวัลจากจักรวาล
                  </p>
                  <div className="bg-gradient-to-r from-purple-700 to-blue-700 text-white rounded-lg p-4 mb-6 border border-yellow-300">
                    <h3 className="text-2xl font-bold">
                      ⭐ {spinResult?.prize?.name}
                    </h3>
                  </div>
                  <button
                    onClick={resetSpin}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    🔄 หมุนใหม่
                  </button>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Prize List */}
            <div className="bg-gradient-to-br from-slate-800/80 to-purple-900/80 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
              <h3 className="text-xl font-bold text-purple-200 mb-4 flex items-center">
                <Gift className="w-6 h-6 mr-2" />
                🏆 รางวัลในจักรวาล
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {prizes.map((prize, index) => (
                  <div
                    key={prize._id}
                    className="flex items-center space-x-2 p-3 rounded-lg border border-purple-400/30"
                    style={{
                      background:
                        index % 2 === 0
                          ? "linear-gradient(135deg, rgba(30, 58, 138, 0.4), rgba(79, 70, 229, 0.4))"
                          : "linear-gradient(135deg, rgba(124, 58, 237, 0.4), rgba(139, 92, 246, 0.4))",
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor:
                          index % 2 === 0 ? "#1e3a8a" : "#7c3aed",
                      }}
                    ></div>
                    <span className="text-sm font-medium text-purple-100">
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
