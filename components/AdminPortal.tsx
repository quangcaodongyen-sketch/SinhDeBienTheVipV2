import React, { useState, useEffect } from 'react';
import {
  getRegisteredUsers,
  saveRegisteredUsers,
  getSystemSettings,
  saveSystemSettings,
  activateUserVip,
  extendUserVip,
  toggleUserLock,
  resetUserPassword,
  setTrialCount,
  isUserVipActive
} from '../data/accounts';
import { UserAccount, SavedExam, SystemSettings, VipPackageType } from '../types';
import { exportToDoc } from '../services/exportUtils';
import {
  Trash2,
  Shield,
  Calendar,
  Download,
  Eye,
  FileText,
  Search,
  User,
  LogOut,
  Clock,
  Layers,
  Users,
  BookOpen,
  Settings,
  BarChart3,
  Lock,
  Unlock,
  Key,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Phone,
  School,
  Sparkles,
  Award,
  Crown,
  Filter,
  Check,
  X,
  TrendingUp,
  Cpu,
  Edit3
} from 'lucide-react';

interface AdminPortalProps {
  onLogout: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onLogout }) => {
  const [users, setUsers] = useState<UserAccount[]>(() => getRegisteredUsers());
  const [settings, setSettings] = useState<SystemSettings>(() => getSystemSettings());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'documents' | 'analytics' | 'settings'>('overview');
  const [memberFilter, setMemberFilter] = useState<'all' | 'vip' | 'trial' | 'expired' | 'locked'>('all');

  // Modals & Selected items
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserAccount | null>(null);
  const [selectedUserForVip, setSelectedUserForVip] = useState<UserAccount | null>(null);
  const [vipPackageChoice, setVipPackageChoice] = useState<VipPackageType>('1year');
  const [customVipDate, setCustomVipDate] = useState('');
  
  const [selectedUserForResetPass, setSelectedUserForResetPass] = useState<UserAccount | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const [selectedUserForTrial, setSelectedUserForTrial] = useState<UserAccount | null>(null);
  const [trialCountInput, setTrialCountInput] = useState<number>(10);

  const [selectedExamForPreview, setSelectedExamForPreview] = useState<{ exam: SavedExam; username: string; creatorName: string } | null>(null);

  // Settings form states
  const [adminOldPass, setAdminOldPass] = useState('');
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');
  const [settingsErrorMsg, setSettingsErrorMsg] = useState('');

  // Editable settings fields
  const [formZaloPhone, setFormZaloPhone] = useState(settings.zaloPhone || '0915213717');
  const [formAdminName, setFormAdminName] = useState(settings.adminName || 'Thầy giáo Đinh Văn Thành');
  const [formAdminSchool, setFormAdminSchool] = useState(settings.adminSchool || 'Trường THCS Đồng Yên, tỉnh Tuyên Quang');
  const [formDefaultTrial, setFormDefaultTrial] = useState(settings.defaultTrialCount || 10);
  const [formAnnouncement, setFormAnnouncement] = useState(settings.announcement || '');

  const handleRefresh = () => {
    setUsers(getRegisteredUsers());
    setSettings(getSystemSettings());
  };

  const handleUpdateUsers = (updatedUsers: UserAccount[]) => {
    setUsers(updatedUsers);
    saveRegisteredUsers(updatedUsers);
  };

  // --- MEMBER ACTIONS ---

  // 1. Phê duyệt VIP
  const handleApproveVip = (username: string) => {
    const updated = activateUserVip(username, vipPackageChoice, customVipDate);
    handleUpdateUsers(updated);
    setSelectedUserForVip(null);
  };

  // 2. Gia hạn VIP (+1 năm / +2 năm)
  const handleExtendVip = (username: string, months: number) => {
    const updated = extendUserVip(username, months);
    handleUpdateUsers(updated);
  };

  // 3. Khóa / Mở khóa
  const handleToggleLock = (username: string) => {
    const updated = toggleUserLock(username);
    handleUpdateUsers(updated);
  };

  // 4. Reset mật khẩu
  const handleResetPassword = () => {
    if (!selectedUserForResetPass || !newPasswordInput.trim()) return;
    const updated = resetUserPassword(selectedUserForResetPass.username, newPasswordInput.trim());
    handleUpdateUsers(updated);
    setSelectedUserForResetPass(null);
    setNewPasswordInput('');
  };

  // 5. Điều chỉnh lượt dùng thử
  const handleSetTrial = () => {
    if (!selectedUserForTrial) return;
    const updated = setTrialCount(selectedUserForTrial.username, trialCountInput);
    handleUpdateUsers(updated);
    setSelectedUserForTrial(null);
  };

  // 6. Xóa thành viên
  const handleDeleteUser = (username: string) => {
    if (
      window.confirm(
        `CẢNH BÁO: Bạn có chắc chắn muốn XÓA thành viên "${username}"? Toàn bộ lịch sử và kho tài liệu của giáo viên này sẽ bị xóa khỏi hệ thống.`
      )
    ) {
      const updated = users.filter((u) => u.username !== username);
      handleUpdateUsers(updated);
      if (selectedUserForDetail?.username === username) setSelectedUserForDetail(null);
    }
  };

  // 7. Xuất đề thi Word
  const handleDownloadExam = (exam: SavedExam, creatorName: string) => {
    const fullContent = `${exam.col1}\n\n***\n\n${exam.col2}\n\n***\n\n${exam.col3}`;
    exportToDoc(fullContent, `De_Thi_VIP_${exam.name.split('.')[0]}_Tai_Boi_Admin`);
  };

  // 8. Lưu cấu hình hệ thống & đổi mật khẩu Admin
  const handleSaveSystemSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSavedMsg('');
    setSettingsErrorMsg('');

    let updatedAdminPass = settings.adminPassword || 'Admin123@';

    // Đổi mật khẩu nếu người dùng nhập
    if (adminNewPass.trim()) {
      if (adminOldPass.trim() !== updatedAdminPass) {
        setSettingsErrorMsg('Mật khẩu Admin hiện tại không chính xác!');
        return;
      }
      if (adminNewPass.trim().length < 6) {
        setSettingsErrorMsg('Mật khẩu mới phải có ít nhất 6 ký tự!');
        return;
      }
      if (adminNewPass.trim() !== adminConfirmPass.trim()) {
        setSettingsErrorMsg('Xác nhận mật khẩu mới không khớp!');
        return;
      }
      updatedAdminPass = adminNewPass.trim();
    }

    const updatedSettings: SystemSettings = {
      ...settings,
      adminPassword: updatedAdminPass,
      zaloPhone: formZaloPhone.trim(),
      adminName: formAdminName.trim(),
      adminSchool: formAdminSchool.trim(),
      defaultTrialCount: Number(formDefaultTrial) || 10,
      announcement: formAnnouncement.trim(),
    };

    saveSystemSettings(updatedSettings);
    setSettings(updatedSettings);
    setAdminOldPass('');
    setAdminNewPass('');
    setAdminConfirmPass('');
    setSettingsSavedMsg('✅ Đã lưu cấu hình hệ thống & mật khẩu Admin thành công!');
    setTimeout(() => setSettingsSavedMsg(''), 4000);
  };

  // --- STATS COMPUTATION ---
  const totalUsers = users.length;
  const vipUsers = users.filter((u) => isUserVipActive(u)).length;
  const trialUsers = users.filter((u) => !isUserVipActive(u) && (u.trialCount || 0) > 0).length;
  const expiredUsers = users.filter((u) => !isUserVipActive(u) && (u.trialCount || 0) <= 0).length;
  const lockedUsers = users.filter((u) => u.isLocked).length;

  const totalUsages = users.reduce((sum, u) => sum + (u.totalUses || 0), 0);

  // Thu thập tất cả hồ sơ đề thi
  const allDocuments = users
    .flatMap((u) =>
      (u.savedExams || []).map((exam) => ({
        ...exam,
        username: u.username,
        creatorName: u.name,
        school: u.school,
        phone: u.phone,
      }))
    )
    .sort((a, b) => b.time.localeCompare(a.time));

  // Lọc thành viên theo tab & search
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.province && u.province.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchSearch) return false;

    if (memberFilter === 'vip') return isUserVipActive(u);
    if (memberFilter === 'trial') return !isUserVipActive(u) && (u.trialCount || 0) > 0;
    if (memberFilter === 'expired') return !isUserVipActive(u) && (u.trialCount || 0) <= 0;
    if (memberFilter === 'locked') return u.isLocked;

    return true;
  });

  // Lọc tài liệu theo search
  const filteredDocuments = allDocuments.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.school.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100">
      
      {/* Admin Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white shadow-xl z-20 shrink-0 border-b border-slate-700/50">
        <div className="max-w-[1700px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-xl flex items-center justify-center font-black text-lg text-slate-900 shadow-md">
              AD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight">HỆ THỐNG QUẢN TRỊ ADMIN VIP</h1>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 font-mono px-2 py-0.5 rounded-full border border-teal-500/30">
                  v2026.1
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Bản quyền: {settings.adminName} – ĐT/Zalo: {settings.zaloPhone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-xs sm:text-sm bg-red-600/20 hover:bg-red-600 border border-red-500/40 hover:border-red-500 text-red-200 hover:text-white px-4 py-2 rounded-xl transition-all font-semibold shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
        <div className="max-w-[1700px] mx-auto px-6 flex overflow-x-auto gap-2 py-2">
          <button
            onClick={() => { setActiveTab('overview'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            📊 Tổng quan
          </button>

          <button
            onClick={() => { setActiveTab('members'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'members'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            👥 Quản lý thành viên ({totalUsers})
          </button>

          <button
            onClick={() => { setActiveTab('documents'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'documents'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            📚 Hồ sơ Giáo án & Đề thi ({allDocuments.length})
          </button>

          <button
            onClick={() => { setActiveTab('analytics'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            📈 Thống kê sử dụng
          </button>

          <button
            onClick={() => { setActiveTab('settings'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            ⚙️ Cài đặt hệ thống
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-[1700px] w-full mx-auto px-6 py-6 flex-1 flex flex-col min-h-0">
        
        {/* ======================================================== */}
        {/* TAB 1: TỔNG QUAN (OVERVIEW) */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng thành viên</p>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">{totalUsers}</h3>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center shrink-0">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Thành viên VIP</p>
                  <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{vipUsers}</h3>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Đang Dùng thử</p>
                  <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{trialUsers}</h3>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Hết hạn / Hết lượt</p>
                  <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{expiredUsers}</h3>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center shrink-0">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng lượt sử dụng AI</p>
                  <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">{totalUsages}</h3>
                </div>
              </div>

            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Info Box */}
              <div className="lg:col-span-1 bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-teal-800/40 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-teal-300" />
                  </div>
                  <h3 className="text-lg font-black tracking-tight mb-1">Cổng Quản Trị Hệ Thống</h3>
                  <p className="text-xs text-teal-200/80 leading-relaxed mb-4">
                    Quản lý toàn diện thành viên, kích hoạt VIP 1 năm / 2 năm / Vĩnh viễn, lưu trữ hồ sơ tài liệu và phân tích lượt sử dụng cho toàn trường.
                  </p>
                  <div className="space-y-2 text-xs text-slate-300 bg-black/20 p-3.5 rounded-xl border border-white/5 font-mono">
                    <div>📱 Zalo Admin: <strong>{settings.zaloPhone}</strong></div>
                    <div>👤 Phụ trách: <strong>{settings.adminName}</strong></div>
                    <div>🏫 Đơn vị: <strong>{settings.adminSchool}</strong></div>
                    <div>🎁 Lượt dùng thử mặc định: <strong>{settings.defaultTrialCount} lượt/máy</strong></div>
                  </div>
                </div>

                <div className="pt-6 flex gap-2">
                  <button
                    onClick={() => setActiveTab('members')}
                    className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-900 font-black rounded-xl text-xs transition-all shadow-md"
                  >
                    Quản lý thành viên →
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700"
                  >
                    Cài đặt
                  </button>
                </div>
              </div>

              {/* Recent Active Members List */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    Thành viên đăng ký mới nhất
                  </h3>
                  <button
                    onClick={() => setActiveTab('members')}
                    className="text-xs text-teal-600 font-bold hover:underline"
                  >
                    Xem tất cả ({totalUsers})
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-y-auto">
                  {users.slice(-6).reverse().map((u) => {
                    const isVip = isUserVipActive(u);
                    return (
                      <div key={u.username} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center shrink-0">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-100">{u.name}</div>
                            <div className="text-slate-400 font-mono">{u.username} · {u.phone}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">{u.school}</span>
                          {isVip ? (
                            <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-full font-bold">
                              👑 VIP
                            </span>
                          ) : (
                            <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-semibold">
                              {u.trialCount} lượt thử
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {users.length === 0 && (
                    <p className="text-slate-400 italic text-center py-8">Chưa có thành viên nào đăng ký.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: QUẢN LÝ THÀNH VIÊN (MEMBERS) */}
        {/* ======================================================== */}
        {activeTab === 'members' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              {/* Filter Pills */}
              <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                <button
                  onClick={() => setMemberFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    memberFilter === 'all'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({totalUsers})
                </button>
                <button
                  onClick={() => setMemberFilter('vip')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    memberFilter === 'vip'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  👑 VIP ({vipUsers})
                </button>
                <button
                  onClick={() => setMemberFilter('trial')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    memberFilter === 'trial'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  🎁 Dùng thử ({trialUsers})
                </button>
                <button
                  onClick={() => setMemberFilter('expired')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    memberFilter === 'expired'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  ⚠️ Hết lượt ({expiredUsers})
                </button>
                <button
                  onClick={() => setMemberFilter('locked')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    memberFilter === 'locked'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  🔒 Bị khóa ({lockedUsers})
                </button>
              </div>

              {/* Search box */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm tên, SĐT, trường, môn..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-teal-500 text-xs sm:text-sm text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="overflow-x-auto flex-1 min-h-0">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-5 py-3.5">Họ và tên</th>
                      <th className="px-5 py-3.5">Tên đăng nhập / MK</th>
                      <th className="px-5 py-3.5">Trường & Tỉnh</th>
                      <th className="px-5 py-3.5">Liên hệ (Zalo)</th>
                      <th className="px-5 py-3.5 text-center">Lượt thử</th>
                      <th className="px-5 py-3.5">Trạng thái VIP</th>
                      <th className="px-5 py-3.5 text-right">Thao tác Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {filteredUsers.map((u) => {
                      const isVip = isUserVipActive(u);
                      return (
                        <tr key={u.username} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                          
                          {/* Name & register time */}
                          <td className="px-5 py-3.5">
                            <div className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                              {u.isLocked && <Lock className="w-3.5 h-3.5 text-red-500" />}
                              <span>{u.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> ĐK: {u.registerTime || 'Chưa rõ'}
                            </div>
                          </td>

                          {/* Username & Pass */}
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{u.username}</div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">Pass: {u.password || '******'}</div>
                          </td>

                          {/* School & Province */}
                          <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                            <div>{u.school}</div>
                            {u.province && <div className="text-[11px] text-slate-400">{u.province}</div>}
                          </td>

                          {/* Contact */}
                          <td className="px-5 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                            <div>{u.phone}</div>
                            {u.email && <div className="text-[11px] text-slate-400">{u.email}</div>}
                          </td>

                          {/* Trial count */}
                          <td className="px-5 py-3.5 text-center">
                            {isVip ? (
                              <span className="text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                                Vô hạn
                              </span>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                                    (u.trialCount || 0) > 0
                                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                                      : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                                  }`}
                                >
                                  {u.trialCount ?? 0}/10 lượt
                                </span>
                                <button
                                  onClick={() => {
                                    setSelectedUserForTrial(u);
                                    setTrialCountInput(10);
                                  }}
                                  className="text-[10px] text-teal-600 hover:underline font-bold"
                                >
                                  + Lượt dùng
                                </button>
                              </div>
                            )}
                          </td>

                          {/* VIP Status */}
                          <td className="px-5 py-3.5">
                            {isVip ? (
                              <div>
                                <span className="inline-flex items-center gap-1 text-[11px] bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-2.5 py-0.5 rounded-full font-black shadow-sm">
                                  👑 VIP {u.vipPackage === 'permanent' ? '(Vĩnh viễn)' : `(${u.vipExpiryYear || 'Active'})`}
                                </span>
                                {u.vipEndDate && (
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    Hạn: {new Date(u.vipEndDate).toLocaleDateString('vi-VN')}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                                Thường
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* VIP Button */}
                              <button
                                onClick={() => setSelectedUserForVip(u)}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  isVip
                                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 border-amber-300'
                                    : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 border-slate-200 dark:border-slate-700'
                                }`}
                                title={isVip ? "Gia hạn / Đổi gói VIP" : "Kích hoạt VIP"}
                              >
                                <Crown className="w-3.5 h-3.5" />
                              </button>

                              {/* Lock / Unlock */}
                              <button
                                onClick={() => handleToggleLock(u.username)}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  u.isLocked
                                    ? 'bg-red-50 text-red-600 border-red-300'
                                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-slate-200 dark:border-slate-700'
                                }`}
                                title={u.isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                              >
                                {u.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                              </button>

                              {/* Reset Password */}
                              <button
                                onClick={() => {
                                  setSelectedUserForResetPass(u);
                                  setNewPasswordInput('123456@');
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg border border-slate-200 dark:border-slate-700 transition-all"
                                title="Đổi/Reset mật khẩu"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>

                              {/* Detail / History */}
                              <button
                                onClick={() => setSelectedUserForDetail(u)}
                                className="p-1.5 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/50 rounded-lg border border-teal-200 dark:border-teal-800 transition-all"
                                title="Xem hồ sơ & Nhật ký"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteUser(u.username)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg border border-rose-200 dark:border-rose-900 transition-all"
                                title="Xóa tài khoản"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400 italic">
                          Không tìm thấy thành viên nào phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: HỒ SƠ GIÁO ÁN & ĐỀ THI (DOCUMENTS) */}
        {/* ======================================================== */}
        {activeTab === 'documents' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            {/* Search Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                  Kho hồ sơ đề thi & tài liệu giáo viên đã lưu ({allDocuments.length})
                </h3>
              </div>

              <div className="relative w-full sm:max-w-sm">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm tên đề thi, giáo viên, trường..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-teal-500 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Document list table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="overflow-x-auto flex-1 min-h-0">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-5 py-3.5">Tên đề thi / Hồ sơ</th>
                      <th className="px-5 py-3.5">Giáo viên tạo</th>
                      <th className="px-5 py-3.5">Trường & SĐT</th>
                      <th className="px-5 py-3.5">Thời gian lưu</th>
                      <th className="px-5 py-3.5 text-right">Tải về / Xem trước</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                            <span>{doc.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-700 dark:text-slate-300">{doc.creatorName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{doc.username}</div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                          <div>{doc.school}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{doc.phone}</div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 font-mono">{doc.time}</td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                setSelectedExamForPreview({
                                  exam: doc,
                                  username: doc.username,
                                  creatorName: doc.creatorName,
                                })
                              }
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/50 border border-teal-200 dark:border-teal-800 rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Xem đề
                            </button>
                            <button
                              onClick={() => handleDownloadExam(doc, doc.creatorName)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Tải Word
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredDocuments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400 italic">
                          Chưa có tài liệu nào trong kho hệ thống.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: THỐNG KÊ SỬ DỤNG (ANALYTICS) */}
        {/* ======================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Account Distribution Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Phân bố tài khoản
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span>👑 Tài khoản VIP</span>
                      <span>{vipUsers} ({totalUsers ? Math.round((vipUsers / totalUsers) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${totalUsers ? (vipUsers / totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span>🎁 Tài khoản Dùng thử</span>
                      <span>{trialUsers} ({totalUsers ? Math.round((trialUsers / totalUsers) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${totalUsers ? (trialUsers / totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span>⚠️ Hết hạn / Hết lượt</span>
                      <span>{expiredUsers} ({totalUsers ? Math.round((expiredUsers / totalUsers) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${totalUsers ? (expiredUsers / totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Usage Breakdown */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  Tính năng được sử dụng nhiều nhất
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-900 flex items-center justify-between">
                    <span className="font-bold text-teal-900 dark:text-teal-300">1. Sinh 3 Đề Biến Thể</span>
                    <span className="font-mono font-black text-teal-700 dark:text-teal-400">Ưa chuộng #1</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">2. Tạo đề tương tự (Ảnh/PDF)</span>
                    <span className="font-mono font-semibold text-slate-500">Ưa chuộng #2</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">3. Ma trận đặc tả CV 7991</span>
                    <span className="font-mono font-semibold text-slate-500">Ưa chuộng #3</span>
                  </div>
                </div>
              </div>

              {/* Most Active Teachers */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  Giáo viên tích cực nhất
                </h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[220px] overflow-y-auto">
                  {users
                    .slice()
                    .sort((a, b) => (b.totalUses || 0) - (a.totalUses || 0))
                    .slice(0, 5)
                    .map((u, i) => (
                      <div key={u.username} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            #{i + 1} {u.name}
                          </div>
                          <div className="text-[10px] text-slate-400">{u.school}</div>
                        </div>
                        <span className="font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-full">
                          {u.totalUses || 0} lượt
                        </span>
                      </div>
                    ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: CÀI ĐẶT HỆ THỐNG (SETTINGS) */}
        {/* ======================================================== */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto w-full space-y-6">
            
            <form onSubmit={handleSaveSystemSettings} className="space-y-6">
              
              {/* Box 1: Thông tin liên hệ & Bản quyền */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-black text-base text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Phone className="w-5 h-5 text-teal-600" />
                  Thông tin Bản quyền & Liên hệ Kích hoạt VIP
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Số điện thoại Zalo Admin
                    </label>
                    <input
                      type="text"
                      value={formZaloPhone}
                      onChange={(e) => setFormZaloPhone(e.target.value)}
                      placeholder="0915213717"
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Tên Quản trị viên / Tác giả
                    </label>
                    <input
                      type="text"
                      value={formAdminName}
                      onChange={(e) => setFormAdminName(e.target.value)}
                      placeholder="Thầy giáo Đinh Văn Thành"
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Đơn vị công tác
                    </label>
                    <input
                      type="text"
                      value={formAdminSchool}
                      onChange={(e) => setFormAdminSchool(e.target.value)}
                      placeholder="Trường THCS Đồng Yên, tỉnh Tuyên Quang"
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Số lượt dùng thử mặc định cho tài khoản mới
                    </label>
                    <input
                      type="number"
                      value={formDefaultTrial}
                      onChange={(e) => setFormDefaultTrial(parseInt(e.target.value) || 10)}
                      min={1}
                      max={100}
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Thông báo toàn trang (Announcement)
                    </label>
                    <input
                      type="text"
                      value={formAnnouncement}
                      onChange={(e) => setFormAnnouncement(e.target.value)}
                      placeholder="Thông báo chào mừng hoặc bảo trì..."
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Box 2: Đổi mật khẩu Admin */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-black text-base text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Lock className="w-5 h-5 text-amber-500" />
                  Đổi mật khẩu tài khoản Quản trị viên (Admin)
                </h3>
                <p className="text-xs text-slate-500">
                  Để trống các ô dưới đây nếu quý Thầy/Cô không có nhu cầu đổi mật khẩu Admin.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Mật khẩu Admin hiện tại
                    </label>
                    <input
                      type="password"
                      value={adminOldPass}
                      onChange={(e) => setAdminOldPass(e.target.value)}
                      placeholder="Mật khẩu cũ..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Mật khẩu Admin mới
                    </label>
                    <input
                      type="password"
                      value={adminNewPass}
                      onChange={(e) => setAdminNewPass(e.target.value)}
                      placeholder="Mật khẩu mới..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={adminConfirmPass}
                      onChange={(e) => setAdminConfirmPass(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Status messages */}
              {settingsSavedMsg && (
                <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>{settingsSavedMsg}</span>
                </div>
              )}

              {settingsErrorMsg && (
                <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span>{settingsErrorMsg}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-black text-sm shadow-md shadow-teal-500/25 transition-all"
                >
                  💾 Lưu thay đổi cấu hình
                </button>
              </div>

            </form>

          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* MODAL 1: Phê duyệt / Gia hạn VIP */}
      {/* ======================================================== */}
      {selectedUserForVip && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center shadow-inner">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">Kích hoạt Gói VIP</h3>
                <p className="text-xs text-slate-400">
                  {selectedUserForVip.name} ({selectedUserForVip.username})
                </p>
              </div>
            </div>

            <div className="space-y-3 py-2 text-xs">
              <label className="font-bold text-slate-600 dark:text-slate-400 block uppercase tracking-wider">
                Chọn gói VIP áp dụng
              </label>

              <div className="space-y-2">
                <label
                  onClick={() => setVipPackageChoice('1year')}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    vipPackageChoice === '1year'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm">Gói VIP 1 Năm (12 tháng)</div>
                    <div className="text-[11px] text-slate-500">Giá: 100.000 VNĐ</div>
                  </div>
                  <input type="radio" name="vipPkg" checked={vipPackageChoice === '1year'} readOnly />
                </label>

                <label
                  onClick={() => setVipPackageChoice('2years')}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    vipPackageChoice === '2years'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm">Gói VIP 2 Năm (24 tháng)</div>
                    <div className="text-[11px] text-slate-500">Giá: 150.000 VNĐ</div>
                  </div>
                  <input type="radio" name="vipPkg" checked={vipPackageChoice === '2years'} readOnly />
                </label>

                <label
                  onClick={() => setVipPackageChoice('permanent')}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    vipPackageChoice === 'permanent'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm">Gói VIP Vĩnh Viễn (Trọn đời)</div>
                    <div className="text-[11px] text-slate-500">Giá: 200.000 VNĐ</div>
                  </div>
                  <input type="radio" name="vipPkg" checked={vipPackageChoice === 'permanent'} readOnly />
                </label>

                <label
                  onClick={() => setVipPackageChoice('custom')}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    vipPackageChoice === 'custom'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm">Tùy chỉnh ngày hết hạn</div>
                    <div className="text-[11px] text-slate-500">Chỉ định ngày cụ thể</div>
                  </div>
                  <input type="radio" name="vipPkg" checked={vipPackageChoice === 'custom'} readOnly />
                </label>
              </div>

              {vipPackageChoice === 'custom' && (
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Ngày hết hạn VIP</label>
                  <input
                    type="date"
                    value={customVipDate}
                    onChange={(e) => setCustomVipDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedUserForVip(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-sm transition-all"
              >
                Hủy
              </button>
              <button
                onClick={() => handleApproveVip(selectedUserForVip.username)}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold text-sm shadow-md shadow-amber-500/20 transition-all"
              >
                Kích hoạt ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: Chi tiết thành viên & Nhật ký hoạt động */}
      {/* ======================================================== */}
      {selectedUserForDetail && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-800 dark:text-slate-100">
                    Hồ sơ chi tiết: {selectedUserForDetail.name}
                  </h3>
                  <p className="text-xs text-slate-400">{selectedUserForDetail.username} · {selectedUserForDetail.school}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForDetail(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              {/* Profile details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Số điện thoại / Zalo</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">
                    {selectedUserForDetail.phone}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Tỉnh / Thành phố</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {selectedUserForDetail.province || 'Chưa cập nhật'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Email</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {selectedUserForDetail.email || 'Chưa cập nhật'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Môn giảng dạy</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {selectedUserForDetail.subject || 'Chưa cập nhật'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Cấp học / Kinh nghiệm</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {selectedUserForDetail.grade || 'THCS'} · {selectedUserForDetail.teachingYear || '5 năm'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Mã thiết bị (Fingerprint)</span>
                  <span className="font-mono text-[10px] text-slate-500 break-all">
                    {selectedUserForDetail.deviceFingerprint || 'Chưa nhận diện'}
                  </span>
                </div>
              </div>

              {/* Activity Timeline */}
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-600" />
                  Nhật ký hoạt động hệ thống
                </h4>
                {selectedUserForDetail.activities && selectedUserForDetail.activities.length > 0 ? (
                  <div className="relative border-l-2 border-slate-200 dark:border-slate-700 pl-4 ml-2 space-y-3">
                    {selectedUserForDetail.activities.slice().reverse().map((act, index) => (
                      <div key={index} className="relative">
                        <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-teal-500 border-2 border-white dark:border-slate-900 ring-2 ring-teal-200" />
                        <div className="text-[10px] text-slate-400 font-mono">{act.time}</div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                          {act.action}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-center py-4">Chưa có nhật ký hoạt động nào.</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedUserForDetail(null)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: Reset mật khẩu thành viên */}
      {/* ======================================================== */}
      {selectedUserForResetPass && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="font-black text-base text-slate-800 dark:text-slate-100 mb-1">
              Đổi mật khẩu cho: {selectedUserForResetPass.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">{selectedUserForResetPass.username}</p>

            <div className="space-y-3 text-xs">
              <label className="font-bold text-slate-600 dark:text-slate-400 block">Nhập mật khẩu mới</label>
              <input
                type="text"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="VD: 123456@"
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-mono"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedUserForResetPass(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleResetPassword}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md"
              >
                Lưu mật khẩu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: Thêm/Sửa lượt dùng thử */}
      {/* ======================================================== */}
      {selectedUserForTrial && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="font-black text-base text-slate-800 dark:text-slate-100 mb-1">
              Cộng lượt dùng thử: {selectedUserForTrial.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">Hiện còn: {selectedUserForTrial.trialCount} lượt</p>

            <div className="space-y-3 text-xs">
              <label className="font-bold text-slate-600 dark:text-slate-400 block">Số lượt thiết lập</label>
              <div className="flex gap-2">
                {[5, 10, 20, 50].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setTrialCountInput(count)}
                    className={`flex-1 py-2 rounded-lg font-bold border ${
                      trialCountInput === count
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    +{count}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={trialCountInput}
                onChange={(e) => setTrialCountInput(parseInt(e.target.value) || 0)}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-mono mt-2"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedUserForTrial(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleSetTrial}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-md"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: Xem trước đề thi */}
      {/* ======================================================== */}
      {selectedExamForPreview && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-5xl w-full p-6 border border-slate-200 dark:border-slate-800 flex flex-col h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                    {selectedExamForPreview.exam.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Giáo viên: {selectedExamForPreview.creatorName} ({selectedExamForPreview.username}) · Thời gian:{' '}
                    {selectedExamForPreview.exam.time}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedExamForPreview(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* 3-column preview */}
            <div className="flex-1 overflow-y-auto py-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden h-full min-h-[300px]">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-center font-bold text-slate-700 dark:text-slate-300 text-xs uppercase">
                    Đề & Đáp Án Đề 1
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/50">
                    {selectedExamForPreview.exam.col1}
                  </div>
                </div>

                <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden h-full min-h-[300px]">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-center font-bold text-slate-700 dark:text-slate-300 text-xs uppercase">
                    Đề & Đáp Án Đề 2
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/50">
                    {selectedExamForPreview.exam.col2}
                  </div>
                </div>

                <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden h-full min-h-[300px]">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-center font-bold text-slate-700 dark:text-slate-300 text-xs uppercase">
                    Đề & Đáp Án Đề 3
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/50">
                    {selectedExamForPreview.exam.col3}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setSelectedExamForPreview(null)}
                className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  handleDownloadExam(selectedExamForPreview.exam, selectedExamForPreview.creatorName);
                  setSelectedExamForPreview(null);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <Download className="w-4 h-4" />
                Tải file Word (.docx)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
