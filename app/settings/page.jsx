"use client";
import { useState, useEffect } from "react";
import SideBar from "@/components/SideBar/page";
import styles from "./styles.module.css";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader/Loader";
import {
  NotificationProvider,
  useNotification,
} from "@/contexts/NotificationContext";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/app/firebase";
import { FaUserShield, FaUser, FaLock, FaSave, FaTimes, FaEdit, FaKey } from "react-icons/fa";
import { MdSettings } from "react-icons/md";

function SettingsContent() {
  const router = useRouter();
  const { success, error: showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [shop, setShop] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [userDocId, setUserDocId] = useState(null);

  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedUser = localStorage.getItem("userName");
        const storedShop = localStorage.getItem("shop");
        const storedRole = localStorage.getItem("role");

        if (!storedUser) {
          router.push("/");
          return;
        }

        setUserName(storedUser);
        setShop(storedShop);
        setIsAdmin(storedRole === "admin");
        setNewName(storedUser);

        const q = query(
          collection(db, "users"),
          where("userName", "==", storedUser),
          where("shop", "==", storedShop)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setUserDocId(snap.docs[0].id);
          setNewName(snap.docs[0].data().userName);
        }

        setLoading(false);
      } catch (err) {
        console.error("Settings load error:", err);
        showError("حدث خطأ");
        setLoading(false);
      }
    };
    loadData();
  }, [router, showError]);

  useEffect(() => {
    if (!isAdmin || !shop) return;

    const loadUsers = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("shop", "==", shop)
        );
        const snap = await getDocs(q);
        const allUsers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUsers(allUsers);
      } catch (err) {
        console.error("Error loading users:", err);
      }
    };
    loadUsers();
  }, [isAdmin, shop]);

  const handleSaveProfile = async () => {
    if (!newName.trim()) {
      showError("يرجى إدخال اسم المستخدم");
      return;
    }
    if (newPassword && newPassword.length < 3) {
      showError("كلمة المرور يجب أن تكون 3 أحرف على الأقل");
      return;
    }
    if (newPassword && !currentPassword) {
      showError("يرجى إدخال كلمة المرور الحالية للتأكيد");
      return;
    }

    try {
      const updateData = { userName: newName.trim() };
      if (newPassword) updateData.password = newPassword;

      await updateDoc(doc(db, "users", userDocId), updateData);

      localStorage.setItem("userName", newName.trim());
      setUserName(newName.trim());
      setNewPassword("");
      setCurrentPassword("");

      success("تم تحديث البيانات بنجاح");
    } catch (err) {
      console.error("Error updating profile:", err);
      showError("حدث خطأ أثناء تحديث البيانات");
    }
  };

  const handleSaveUser = async (user) => {
    if (!editName.trim()) {
      showError("يرجى إدخال اسم المستخدم");
      return;
    }

    try {
      const updateData = { userName: editName.trim() };
      if (editPassword) updateData.password = editPassword;
      if (editRole) updateData.role = editRole;

      await updateDoc(doc(db, "users", user.id), updateData);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, userName: editName.trim(), ...(editPassword ? { password: editPassword } : {}), ...(editRole ? { role: editRole } : {}) }
            : u
        )
      );

      setEditingUser(null);
      setEditName("");
      setEditPassword("");
      setEditRole("");
      success("تم تحديث بيانات المستخدم بنجاح");
    } catch (err) {
      console.error("Error updating user:", err);
      showError("حدث خطأ أثناء تحديث بيانات المستخدم");
    }
  };

  const openEditUser = (user) => {
    setEditingUser(user.id);
    setEditName(user.userName);
    setEditPassword("");
    setEditRole(user.role || "user");
  };

  if (loading) return <Loader />;

  return (
    <div className={styles.settings}>
      <SideBar />
      <div className={styles.content}>
        <div className={styles.menuHeader}>
          <div className={styles.menuTitle}>
            <MdSettings style={{ marginLeft: 10 }} />
            الإعدادات
          </div>
        </div>

        {/* My Profile */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionCardHeader}>
            <FaUser style={{ marginLeft: 8 }} />
            بيانات حسابي
          </div>
          <div className={styles.sectionCardBody}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>اسم المستخدم</label>
                <div className={styles.inputWrapper}>
                  <FaUser className={styles.inputIcon} />
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className={styles.formInput}
                    placeholder="اسم المستخدم"
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>كلمة المرور الجديدة</label>
                <div className={styles.inputWrapper}>
                  <FaLock className={styles.inputIcon} />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={styles.formInput}
                    placeholder="اتركه فارغاً إذا لم ترد التغيير"
                  />
                </div>
              </div>
              {newPassword && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>كلمة المرور الحالية</label>
                  <div className={styles.inputWrapper}>
                    <FaKey className={styles.inputIcon} />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={styles.formInput}
                      placeholder="أدخل كلمة المرور الحالية للتأكيد"
                    />
                  </div>
                </div>
              )}
            </div>
            <button onClick={handleSaveProfile} className={styles.saveBtn}>
              <FaSave />
              حفظ التغييرات
            </button>
          </div>
        </div>

        {/* Admin: User Management */}
        {isAdmin && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionCardHeader}>
              <FaUserShield style={{ marginLeft: 8 }} />
              إدارة المستخدمين
            </div>
            <div className={styles.sectionCardBody}>
              {users.length === 0 ? (
                <p className={styles.emptyText}>لا يوجد مستخدمون آخرون في هذا الفرع</p>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.settingsTable}>
                    <thead>
                      <tr>
                        <th>اسم المستخدم</th>
                        <th>الصلاحية</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          {editingUser === user.id ? (
                            <>
                              <td>
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className={styles.inlineInput}
                                />
                              </td>
                              <td>
                                <select
                                  value={editRole}
                                  onChange={(e) => setEditRole(e.target.value)}
                                  className={styles.inlineSelect}
                                >
                                  <option value="user">مستخدم</option>
                                  <option value="admin">مدير</option>
                                </select>
                              </td>
                              <td>
                                <div className={styles.actionCell}>
                                  <button
                                    className={styles.actionBtn}
                                    onClick={() => handleSaveUser(user)}
                                    title="حفظ"
                                  >
                                    <FaSave />
                                  </button>
                                  <button
                                    className={`${styles.actionBtn} ${styles.cancelActionBtn}`}
                                    onClick={() => setEditingUser(null)}
                                    title="إلغاء"
                                  >
                                    <FaTimes />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className={styles.nameCell}>{user.userName}</td>
                              <td>
                                <span className={user.role === "admin" ? styles.adminBadge : styles.userBadge}>
                                  {user.role === "admin" ? "مدير" : "مستخدم"}
                                </span>
                              </td>
                              <td>
                                <button
                                  className={styles.actionBtn}
                                  onClick={() => openEditUser(user)}
                                  title="تعديل"
                                >
                                  <FaEdit />
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <NotificationProvider>
      <SettingsContent />
    </NotificationProvider>
  );
}
