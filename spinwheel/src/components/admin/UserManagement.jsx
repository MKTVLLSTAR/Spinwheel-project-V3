import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Edit,
  Crown,
  User,
  Shield,
  Calendar,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { adminAPI } from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const UserManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const { admin: currentAdmin } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "admin",
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
  });

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAll();
      setAdmins(response.data.admins);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลผู้ดูแลได้");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!formData.username || !formData.password) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (formData.username.length < 3) {
      toast.error("ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    try {
      setCreating(true);
      await adminAPI.create(formData);
      toast.success("สร้างผู้ดูแลสำเร็จ");
      setShowCreateModal(false);
      setFormData({ username: "", password: "", role: "admin" });
      loadAdmins();
    } catch (error) {
      console.error("Create admin error:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAdmin = async (adminId, adminUsername) => {
    if (!confirm(`คุณต้องการลบผู้ดูแล "${adminUsername}" หรือไม่?`)) {
      return;
    }

    try {
      setDeleting(adminId);
      await adminAPI.delete(adminId);
      toast.success("ลบผู้ดูแลสำเร็จ");
      loadAdmins();
    } catch (error) {
      console.error("Delete admin error:", error);
    } finally {
      setDeleting(null);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      toast.error("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    try {
      await adminAPI.updatePassword(selectedAdmin.id, passwordData.newPassword);
      toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
      setShowPasswordModal(false);
      setPasswordData({ newPassword: "" });
      setSelectedAdmin(null);
    } catch (error) {
      console.error("Update password error:", error);
    }
  };

  const getRoleText = (role) => {
    return role === "superadmin" ? "Super Admin" : "Admin";
  };

  const getRoleColor = (role) => {
    return role === "superadmin"
      ? "bg-purple-100 text-purple-800 border-purple-200"
      : "bg-blue-100 text-blue-800 border-blue-200";
  };

  const getRoleIcon = (role) => {
    return role === "superadmin" ? Crown : Shield;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">
            จัดการผู้ดูแลระบบ
          </h1>
          <p className="text-gray-600 mt-1">สร้างและจัดการบัญชีผู้ดูแลระบบ</p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          เพิ่มผู้ดูแล
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="admin-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ผู้ดูแลทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">
                {admins.length}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
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
              <p className="text-sm text-gray-600">Super Admin</p>
              <p className="text-2xl font-bold text-purple-600">
                {admins.filter((admin) => admin.role === "superadmin").length}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Crown className="w-6 h-6 text-purple-600" />
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
              <p className="text-sm text-gray-600">Admin</p>
              <p className="text-2xl font-bold text-blue-600">
                {admins.filter((admin) => admin.role === "admin").length}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Admin List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="admin-card"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            รายชื่อผู้ดูแล
          </h3>
          <button
            onClick={loadAdmins}
            className="btn bg-gray-600 text-white hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            รีเฟรช
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="loading-spin w-8 h-8"></div>
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">ไม่พบข้อมูลผู้ดูแล</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    ชื่อผู้ใช้
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    บทบาท
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    วันที่สร้าง
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
                {admins.map((admin) => {
                  const RoleIcon = getRoleIcon(admin.role);
                  const isCurrentAdmin = admin.id === currentAdmin?.id;

                  return (
                    <tr
                      key={admin.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center mr-3">
                            <RoleIcon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">
                              {admin.username}
                            </span>
                            {isCurrentAdmin && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                คุณ
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(
                            admin.role
                          )}`}
                        >
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {getRoleText(admin.role)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(admin.createdAt).toLocaleDateString("th-TH")}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {admin.createdBy?.username || "ระบบ"}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setShowPasswordModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                            title="เปลี่ยนรหัสผ่าน"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {admin.role !== "superadmin" && !isCurrentAdmin && (
                            <button
                              onClick={() =>
                                handleDeleteAdmin(admin.id, admin.username)
                              }
                              disabled={deleting === admin.id}
                              className="text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                              title="ลบ"
                            >
                              {deleting === admin.id ? (
                                <div className="loading-spin w-4 h-4"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              เพิ่มผู้ดูแลใหม่
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อผู้ใช้
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                  placeholder="ชื่อผู้ใช้"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                    placeholder="รหัสผ่าน"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  บทบาท
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                >
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Super Admin สามารถมีได้แค่คนเดียวเท่านั้น
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ username: "", password: "", role: "admin" });
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreateAdmin}
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

      {/* Change Password Modal */}
      {showPasswordModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              เปลี่ยนรหัสผ่าน: {selectedAdmin.username}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสผ่านใหม่
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                    placeholder="รหัสผ่านใหม่"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ newPassword: "" });
                  setSelectedAdmin(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button onClick={handleUpdatePassword} className="btn-primary">
                <Edit className="w-4 h-4 mr-2" />
                เปลี่ยนรหัสผ่าน
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
