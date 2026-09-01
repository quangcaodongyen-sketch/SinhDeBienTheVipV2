import React, { useState, useEffect, useRef } from 'react';
import {
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  User,
  School,
  Phone,
  Lock,
  Mail,
  MapPin,
  BookOpen,
  GraduationCap,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { validateAccount, getRegisteredUsers, saveRegisteredUsers, getSystemSettings } from '../data/accounts';
import { isDeviceRegistered, markDeviceRegistered, getDeviceFingerprint } from '../services/deviceService';
import { UserAccount } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  defaultTab?: 'login' | 'register';
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  defaultTab = 'login',
}) => {
  const [isRegisterTab, setIsRegisterTab] = useState(defaultTab === 'register');
  const settings = getSystemSettings();

  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register required fields
  const [regFullName, setRegFullName] = useState('');
  const [regSchool, setRegSchool] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Register optional fields
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regProvince, setRegProvince] = useState('');
  const [regSubject, setRegSubject] = useState('');
  const [regGrade, setRegGrade] = useState('');
  const [regTeachingYear, setRegTeachingYear] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [loading, setLoading] = useState(false);

  const loginUsernameRef = useRef<HTMLInputElement>(null);
  const regNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setIsRegisterTab(defaultTab === 'register');
      setTimeout(() => {
        if (defaultTab === 'register') {
          regNameRef.current?.focus();
        } else {
          loginUsernameRef.current?.focus();
        }
      }, 200);
    }
  }, [isOpen, defaultTab]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      triggerShake();
      return;
    }

    const result = validateAccount(username, password);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
      onClose();
    } else {
      setError(result.message || 'Sai tên đăng nhập hoặc mật khẩu!');
      triggerShake();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1. Kiểm tra các trường bắt buộc
    if (
      !regFullName.trim() ||
      !regSchool.trim() ||
      !regPhone.trim() ||
      !regUsername.trim() ||
      !regPassword.trim() ||
      !regConfirmPassword.trim()
    ) {
      setError('Vui lòng nhập đầy đủ các trường thông tin đăng ký bắt buộc.');
      setLoading(false);
      triggerShake();
      return;
    }

    // 2. Kiểm tra mật khẩu khớp nhau
    if (regPassword.trim() !== regConfirmPassword.trim()) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu đã nhập!');
      setLoading(false);
      triggerShake();
      return;
    }

    // 3. Kiểm tra trùng tên đăng nhập hoặc số điện thoại
    const users = getRegisteredUsers();
    const cleanUsername = regUsername.trim().toLowerCase();
    const cleanPhone = regPhone.trim();

    if (cleanUsername === 'admin' || users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      setError('Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.');
      setLoading(false);
      triggerShake();
      return;
    }

    // 5. Khởi tạo tài khoản mới với 10 lượt dùng thử đầy đủ tính năng
    const deviceId = await getDeviceFingerprint();
    const defaultTrial = settings.defaultTrialCount || 10;
    const now = new Date();

    const newAccount: UserAccount = {
      username: regUsername.trim(),
      password: regPassword.trim(),
      name: regFullName.trim(),
      school: regSchool.trim(),
      phone: regPhone.trim(),
      email: regEmail.trim() || undefined,
      province: regProvince.trim() || undefined,
      subject: regSubject.trim() || undefined,
      grade: regGrade.trim() || undefined,
      teachingYear: regTeachingYear.trim() || undefined,
      trialCount: defaultTrial,
      totalUses: 0,
      isVip: false,
      isLocked: false,
      deviceFingerprint: deviceId,
      registerTime: now.toLocaleString('vi-VN'),
      lastLoginTime: now.toLocaleString('vi-VN'),
      activities: [
        {
          time: now.toLocaleString('vi-VN'),
          action: `Đăng ký tài khoản mới thành công (Được cấp ${defaultTrial} lượt dùng thử miễn phí)`,
        },
      ],
      savedExams: [],
    };

    users.push(newAccount);
    saveRegisteredUsers(users);

    // Đánh dấu thiết bị đã đăng ký
    await markDeviceRegistered(regUsername.trim());

    setLoading(false);
    onLoginSuccess(newAccount);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 text-white p-6 shrink-0 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                {isRegisterTab ? <UserPlus className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">
                  {isRegisterTab ? 'Đăng ký Tài khoản Dùng thử' : 'Đăng nhập Hệ thống'}
                </h3>
                <p className="text-xs text-teal-100 font-medium mt-0.5">
                  Sinh Đề Biến Thể VIP — Chuẩn Công văn 7991
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-3 shrink-0 bg-slate-50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={() => {
              setIsRegisterTab(false);
              setError('');
            }}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
              !isRegisterTab
                ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <LogIn className="w-4 h-4" /> Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegisterTab(true);
              setError('');
            }}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
              isRegisterTab
                ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" /> Đăng ký dùng thử (10 lượt)
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-800 dark:text-slate-200">
          
          {/* LOGIN TAB */}
          {!isRegisterTab && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={loginUsernameRef}
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Nhập tên đăng nhập hoặc Admin..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Nhập mật khẩu..."
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl text-xs sm:text-sm flex items-start gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold text-sm transition-all"
                >
                  Để sau
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-teal-500/25 transition-all"
                >
                  🔓 Đăng nhập
                </button>
              </div>
            </form>
          )}

          {/* REGISTER TAB */}
          {isRegisterTab && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              
              {/* Notice */}
              <div className="bg-teal-50 dark:bg-teal-950/40 p-3 rounded-xl border border-teal-200 dark:border-teal-900 text-xs text-teal-800 dark:text-teal-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Mỗi thiết bị được đăng ký <strong>01 tài khoản dùng thử 10 lượt</strong> đầy đủ tính năng.</span>
              </div>

              {/* Required fields */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Họ và tên giáo viên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={regNameRef}
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="VD: Đinh Văn Thành"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Trường / Đơn vị công tác <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={regSchool}
                      onChange={(e) => setRegSchool(e.target.value)}
                      placeholder="VD: THCS Đồng Yên"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Số điện thoại (Zalo) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="VD: 0915213717"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="VD: thanhthcsdongyen"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mật khẩu tự chọn"
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Optional fields toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold flex items-center gap-1"
                >
                  {showOptionalFields ? '▲ Thu gọn thông tin bổ sung' : '▼ Bổ sung: Email, Tỉnh/Thành, Môn, Cấp học...'}
                </button>
              </div>

              {showOptionalFields && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Email</label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Tỉnh / Thành phố</label>
                      <input
                        type="text"
                        value={regProvince}
                        onChange={(e) => setRegProvince(e.target.value)}
                        placeholder="VD: Tuyên Quang, Hà Nội..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Môn giảng dạy</label>
                      <input
                        type="text"
                        value={regSubject}
                        onChange={(e) => setRegSubject(e.target.value)}
                        placeholder="VD: Toán, Anh..."
                        className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Cấp học</label>
                      <input
                        type="text"
                        value={regGrade}
                        onChange={(e) => setRegGrade(e.target.value)}
                        placeholder="VD: THCS, THPT"
                        className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Năm công tác</label>
                      <input
                        type="text"
                        value={regTeachingYear}
                        onChange={(e) => setRegTeachingYear(e.target.value)}
                        placeholder="VD: 5 năm, 10 năm"
                        className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl text-xs sm:text-sm flex items-start gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold text-sm transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-teal-500/25 transition-all disabled:opacity-50"
                >
                  {loading ? 'Đang khởi tạo...' : '📝 Đăng ký ngay'}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer info */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 shrink-0">
          Mọi thắc mắc liên hệ <strong className="text-teal-700 dark:text-teal-400">Thầy giáo Đinh Văn Thành – ĐT/Zalo: 0915.213717</strong>
        </div>

      </div>
    </div>
  );
};
