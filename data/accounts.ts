// ============================================
// HỆ THỐNG QUẢN LÝ TÀI KHOẢN, CÀI ĐẶT & THÀNH VIÊN
// ============================================
import { UserAccount, SystemSettings, VipPackageConfig, VipPackageType, SavedExam } from '../types';

export const DEFAULT_VIP_PACKAGES: VipPackageConfig[] = [
  {
    id: '1year',
    name: 'Gói VIP 1 Năm',
    durationMonths: 12,
    durationText: '12 tháng (1 năm)',
    price: 100000,
    priceText: '100.000 VNĐ',
    description: 'Sử dụng đầy đủ mọi tính năng sinh đề và tài liệu trong 1 năm',
    isPopular: false,
  },
  {
    id: '2years',
    name: 'Gói VIP 2 Năm',
    durationMonths: 24,
    durationText: '24 tháng (2 năm)',
    price: 150000,
    priceText: '150.000 VNĐ',
    description: 'Tiết kiệm 50.000đ khi đăng ký gói 2 năm, hỗ trợ cập nhật tính năng mới',
    isPopular: true,
  },
  {
    id: 'permanent',
    name: 'Gói VIP Vĩnh Viễn',
    durationMonths: undefined,
    durationText: 'Vĩnh viễn',
    price: 200000,
    priceText: '200.000 VNĐ',
    description: 'Sử dụng trọn đời không giới hạn thời gian, cập nhật trọn bộ tính năng VIP',
    isPopular: false,
  },
];

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  adminPassword: 'Admin123@',
  zaloPhone: '0915213717',
  adminName: 'Thầy giáo Đinh Văn Thành',
  adminSchool: 'Trường THCS Đồng Yên, tỉnh Tuyên Quang',
  defaultTrialCount: 10,
  announcement: 'Chào mừng quý Thầy/Cô đến với Hệ thống Sinh Đề Biến Thể VIP!',
  vipPackages: DEFAULT_VIP_PACKAGES,
};

const SETTINGS_KEY = 'examcraft_system_settings';
const USERS_KEY = 'examcraft_users';

/** Lấy cấu hình hệ thống */
export function getSystemSettings(): SystemSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SYSTEM_SETTINGS,
        ...parsed,
        vipPackages: parsed.vipPackages || DEFAULT_VIP_PACKAGES,
      };
    }
  } catch (e) {
    console.error('Error loading system settings:', e);
  }
  return DEFAULT_SYSTEM_SETTINGS;
}

/** Lưu cấu hình hệ thống */
export function saveSystemSettings(settings: SystemSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/** Lấy danh sách thành viên */
export function getRegisteredUsers(): UserAccount[] {
  try {
    const data = localStorage.getItem(USERS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading users:', e);
  }
  return [];
}

/** Lưu danh sách thành viên */
export function saveRegisteredUsers(users: UserAccount[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/**
 * Xác thực tài khoản đăng nhập
 */
export function validateAccount(usernameInput: string, passwordInput: string): { success: boolean; user?: UserAccount; message?: string } {
  const trimmedUser = usernameInput.trim();
  const trimmedPass = passwordInput.trim();
  const lowerUser = trimmedUser.toLowerCase();

  const settings = getSystemSettings();
  const currentAdminPass = settings.adminPassword || 'Admin123@';

  // 1. Kiểm tra tài khoản Admin
  if (lowerUser === 'admin') {
    if (trimmedPass === currentAdminPass) {
      const adminAcc: UserAccount = {
        username: 'Admin',
        name: settings.adminName || 'Quản trị viên',
        phone: settings.zaloPhone || '0915213717',
        school: settings.adminSchool || 'Trường THCS Đồng Yên',
        trialCount: 999999,
        isVip: true,
        vipPackage: 'permanent',
        vipExpiryYear: 2099,
        registerTime: new Date().toLocaleDateString('vi-VN'),
        lastLoginTime: new Date().toLocaleString('vi-VN'),
        activities: [],
        savedExams: [],
      };
      return { success: true, user: adminAcc };
    } else {
      return { success: false, message: 'Sai mật khẩu quản trị viên Admin!' };
    }
  }

  // 2. Kiểm tra danh sách thành viên đã đăng ký
  const users = getRegisteredUsers();
  const matchedUser = users.find(
    (u) => u.username.toLowerCase() === lowerUser && u.password === trimmedPass
  );

  if (matchedUser) {
    if (matchedUser.isLocked) {
      return {
        success: false,
        message: 'Tài khoản của bạn hiện đang bị tạm khóa. Vui lòng liên hệ Admin qua Zalo: ' + settings.zaloPhone,
      };
    }

    // Cập nhật last login và log
    matchedUser.lastLoginTime = new Date().toLocaleString('vi-VN');
    matchedUser.activities = matchedUser.activities || [];
    matchedUser.activities.push({
      time: new Date().toLocaleString('vi-VN'),
      action: 'Đăng nhập vào hệ thống',
    });
    saveRegisteredUsers(users);

    return { success: true, user: matchedUser };
  }

  return { success: false, message: 'Sai tên đăng nhập hoặc mật khẩu!' };
}

/**
 * Kiểm tra xem tài khoản VIP có còn hạn hay không
 */
export function isUserVipActive(user: UserAccount | null): boolean {
  if (!user) return false;
  if (user.username.toLowerCase() === 'admin') return true;
  if (!user.isVip) return false;

  // Gói vĩnh viễn
  if (user.vipPackage === 'permanent' || !user.vipEndDate) {
    if (!user.vipExpiryYear || user.vipExpiryYear >= new Date().getFullYear()) {
      return true;
    }
  }

  // Gói có ngày hết hạn
  if (user.vipEndDate) {
    const end = new Date(user.vipEndDate).getTime();
    const now = new Date().getTime();
    return end >= now;
  }

  if (user.vipExpiryYear) {
    return user.vipExpiryYear >= new Date().getFullYear();
  }

  return true;
}

/**
 * Kích hoạt VIP cho thành viên
 */
export function activateUserVip(
  username: string,
  pkgType: VipPackageType,
  customExpiryDate?: string
): UserAccount[] {
  const users = getRegisteredUsers();
  const now = new Date();

  const updated = users.map((u) => {
    if (u.username.toLowerCase() === username.toLowerCase()) {
      let endDateStr: string | undefined = undefined;
      let expiryYear: number | undefined = undefined;
      let desc = '';

      if (pkgType === '1year') {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        endDateStr = d.toISOString();
        expiryYear = d.getFullYear();
        desc = `Kích hoạt gói VIP 1 năm (Hạn dùng: ${d.toLocaleDateString('vi-VN')})`;
      } else if (pkgType === '2years') {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 2);
        endDateStr = d.toISOString();
        expiryYear = d.getFullYear();
        desc = `Kích hoạt gói VIP 2 năm (Hạn dùng: ${d.toLocaleDateString('vi-VN')})`;
      } else if (pkgType === 'permanent') {
        endDateStr = undefined;
        expiryYear = 2099;
        desc = 'Kích hoạt gói VIP Vĩnh viễn (Không giới hạn thời gian)';
      } else if (pkgType === 'custom' && customExpiryDate) {
        endDateStr = new Date(customExpiryDate).toISOString();
        expiryYear = new Date(customExpiryDate).getFullYear();
        desc = `Kích hoạt gói VIP tùy chỉnh đến ${new Date(customExpiryDate).toLocaleDateString('vi-VN')}`;
      }

      return {
        ...u,
        isVip: true,
        vipPackage: pkgType,
        vipStartDate: now.toISOString(),
        vipEndDate: endDateStr,
        vipExpiryYear: expiryYear,
        activities: [
          ...(u.activities || []),
          {
            time: now.toLocaleString('vi-VN'),
            action: `Admin ${desc}`,
          },
        ],
      };
    }
    return u;
  });

  saveRegisteredUsers(updated);
  return updated;
}

/**
 * Gia hạn VIP thêm số tháng
 */
export function extendUserVip(username: string, monthsToAdd: number): UserAccount[] {
  const users = getRegisteredUsers();
  const now = new Date();

  const updated = users.map((u) => {
    if (u.username.toLowerCase() === username.toLowerCase()) {
      let baseDate = u.vipEndDate ? new Date(u.vipEndDate) : new Date();
      if (baseDate.getTime() < now.getTime()) {
        baseDate = new Date();
      }
      baseDate.setMonth(baseDate.getMonth() + monthsToAdd);

      return {
        ...u,
        isVip: true,
        vipEndDate: baseDate.toISOString(),
        vipExpiryYear: baseDate.getFullYear(),
        activities: [
          ...(u.activities || []),
          {
            time: now.toLocaleString('vi-VN'),
            action: `Admin gia hạn thêm ${monthsToAdd} tháng VIP đến ${baseDate.toLocaleDateString('vi-VN')}`,
          },
        ],
      };
    }
    return u;
  });

  saveRegisteredUsers(updated);
  return updated;
}

/**
 * Khóa / Mở khóa tài khoản
 */
export function toggleUserLock(username: string): UserAccount[] {
  const users = getRegisteredUsers();
  const now = new Date();

  const updated = users.map((u) => {
    if (u.username.toLowerCase() === username.toLowerCase()) {
      const nextLocked = !u.isLocked;
      return {
        ...u,
        isLocked: nextLocked,
        activities: [
          ...(u.activities || []),
          {
            time: now.toLocaleString('vi-VN'),
            action: nextLocked ? 'Admin đã tạm khóa tài khoản' : 'Admin đã mở khóa tài khoản',
          },
        ],
      };
    }
    return u;
  });

  saveRegisteredUsers(updated);
  return updated;
}

/**
 * Reset mật khẩu thành viên
 */
export function resetUserPassword(username: string, newPassword: string): UserAccount[] {
  const users = getRegisteredUsers();
  const now = new Date();

  const updated = users.map((u) => {
    if (u.username.toLowerCase() === username.toLowerCase()) {
      return {
        ...u,
        password: newPassword,
        activities: [
          ...(u.activities || []),
          {
            time: now.toLocaleString('vi-VN'),
            action: `Admin đặt lại mật khẩu mới`,
          },
        ],
      };
    }
    return u;
  });

  saveRegisteredUsers(updated);
  return updated;
}

/**
 * Cộng thêm hoặc thay đổi số lượt dùng thử
 */
export function setTrialCount(username: string, count: number): UserAccount[] {
  const users = getRegisteredUsers();
  const now = new Date();

  const updated = users.map((u) => {
    if (u.username.toLowerCase() === username.toLowerCase()) {
      return {
        ...u,
        trialCount: count,
        activities: [
          ...(u.activities || []),
          {
            time: now.toLocaleString('vi-VN'),
            action: `Admin thiết lập lại số lượt dùng thử thành: ${count} lượt`,
          },
        ],
      };
    }
    return u;
  });

  saveRegisteredUsers(updated);
  return updated;
}

/**
 * Trừ 1 lượt dùng thử khi sử dụng AI
 */
export function deductTrialUsage(username: string, featureName: string): { success: boolean; user?: UserAccount } {
  const users = getRegisteredUsers();
  const now = new Date();
  const lower = username.toLowerCase();

  if (lower === 'admin') {
    return { success: true };
  }

  const target = users.find((u) => u.username.toLowerCase() === lower);
  if (!target) return { success: false };

  // Nếu là VIP đang hoạt động -> Không trừ lượt, chỉ ghi nhận tổng lượt sử dụng và nhật ký
  if (isUserVipActive(target)) {
    target.totalUses = (target.totalUses || 0) + 1;
    target.activities = target.activities || [];
    target.activities.push({
      time: now.toLocaleString('vi-VN'),
      action: `${featureName} (Tài khoản VIP)`,
    });
    saveRegisteredUsers(users);
    return { success: true, user: target };
  }

  // Nếu là tài khoản thường -> kiểm tra số lượt dùng thử còn lại
  if (target.trialCount > 0) {
    target.trialCount -= 1;
    target.totalUses = (target.totalUses || 0) + 1;
    target.activities = target.activities || [];
    target.activities.push({
      time: now.toLocaleString('vi-VN'),
      action: `${featureName}. Số lượt thử còn lại: ${target.trialCount}/10`,
    });
    saveRegisteredUsers(users);
    return { success: true, user: target };
  }

  return { success: false, user: target };
}

/**
 * Lưu hồ sơ tài liệu / đề thi cho thành viên
 */
export function saveUserExamDocument(
  username: string,
  exam: { name: string; col1: string; col2: string; col3: string; subject?: string; grade?: string }
): SavedExam | null {
  const users = getRegisteredUsers();
  const now = new Date();
  const lower = username.toLowerCase();

  const newExam: SavedExam = {
    id: `EX_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: exam.name,
    col1: exam.col1,
    col2: exam.col2,
    col3: exam.col3,
    time: now.toLocaleString('vi-VN'),
    subject: exam.subject,
    grade: exam.grade,
  };

  const target = users.find((u) => u.username.toLowerCase() === lower);
  if (target) {
    target.savedExams = target.savedExams || [];
    target.savedExams.unshift(newExam);
    target.activities = target.activities || [];
    target.activities.push({
      time: now.toLocaleString('vi-VN'),
      action: `Lưu hồ sơ đề thi: ${exam.name}`,
    });
    saveRegisteredUsers(users);
    return newExam;
  }

  return null;
}
