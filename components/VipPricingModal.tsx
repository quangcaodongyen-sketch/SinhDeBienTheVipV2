import React, { useState } from 'react';
import {
  Crown,
  CheckCircle2,
  Phone,
  MessageCircle,
  Sparkles,
  Copy,
  Check,
  X,
  Shield,
  Zap,
  Star,
  Award
} from 'lucide-react';
import { getSystemSettings } from '../data/accounts';
import { VipPackageConfig } from '../types';

interface VipPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOutOfTrial?: boolean;
}

export const VipPricingModal: React.FC<VipPricingModalProps> = ({
  isOpen,
  onClose,
  isOutOfTrial = false,
}) => {
  const settings = getSystemSettings();
  const [copiedPhone, setCopiedPhone] = useState(false);
  const zaloPhone = settings.zaloPhone || '0915213717';
  const adminName = settings.adminName || 'Đinh Thành';
  const schoolName = settings.adminSchool || 'Trường THCS Đồng Yên, tỉnh Tuyên Quang';
  const packages: VipPackageConfig[] = settings.vipPackages || [];

  if (!isOpen) return null;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(zaloPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-amber-200 dark:border-amber-900/50 overflow-hidden">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-white p-6 shrink-0 overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-xl" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-white/10 rounded-full blur-lg" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20">
                <Crown className="w-7 h-7 text-amber-100" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                  {isOutOfTrial ? 'THÔNG BÁO HẾT LƯỢT DÙNG THỬ' : 'NÂNG CẤP TÀI KHOẢN VIP'}
                </h2>
                <p className="text-xs sm:text-sm text-amber-100 font-medium mt-0.5">
                  Đồng hành cùng Giáo viên trong công tác soạn giảng số & sinh đề chuẩn 100%
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-black/15 hover:bg-black/30 flex items-center justify-center transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          
          {/* Out of trial notice box */}
          {isOutOfTrial && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="space-y-2 text-sm leading-relaxed">
                  <p className="font-bold text-amber-950 dark:text-amber-200">
                    Bạn đã sử dụng hết 10 lượt dùng thử miễn phí.
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    Nếu thấy ứng dụng hữu ích cho công việc soạn giảng và muốn tiếp tục sử dụng đầy đủ tính năng, bạn có thể liên hệ để kích hoạt tài khoản VIP và góp phần duy trì, nâng cấp hệ thống phục vụ giáo viên.
                  </p>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-amber-200/70 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <span>📱 Zalo: <span className="text-emerald-700 dark:text-emerald-400 font-mono text-base">{zaloPhone}</span> – {adminName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyPhone}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
                      >
                        {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedPhone ? 'Đã chép số!' : 'Sao chép SĐT'}
                      </button>
                      <a
                        href={`https://zalo.me/${zaloPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Nhắn Zalo ngay
                      </a>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    Xin cảm ơn sự ủng hộ của quý thầy cô!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Grid */}
          <div>
            <div className="text-center mb-5">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                CÁC GÓI TÀI KHOẢN VIP ĐƯỢC ƯA CHUỘNG
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Kích hoạt nhanh chóng trong 1 phút sau khi liên hệ Admin
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map((pkg) => {
                const isHighlight = pkg.isPopular || pkg.id === '2years';
                return (
                  <div
                    key={pkg.id}
                    className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 ${
                      isHighlight
                        ? 'border-2 border-amber-500 bg-gradient-to-b from-amber-50/70 to-orange-50/40 dark:from-amber-950/40 dark:to-slate-900 shadow-lg shadow-amber-500/10 scale-102'
                        : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-amber-300'
                    }`}
                  >
                    {isHighlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                        ⭐ Khuyên Dùng
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100">{pkg.name}</h4>
                        {pkg.id === 'permanent' ? (
                          <Award className="w-5 h-5 text-purple-600" />
                        ) : (
                          <Zap className="w-5 h-5 text-amber-500" />
                        )}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        Thời hạn: <strong className="text-slate-700 dark:text-slate-300">{pkg.durationText}</strong>
                      </div>

                      <div className="mb-4">
                        <div className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono">
                          {pkg.priceText}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                        {pkg.description}
                      </p>

                      <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Sinh 3 đề biến thể không giới hạn</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Tạo đề tương tự chuẩn ma trận</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Xuất file Word .docx đẹp chuẩn</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Lưu trữ kho đề thi trực tiếp</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                      <a
                        href={`https://zalo.me/${zaloPhone}?text=${encodeURIComponent(
                          `Chào Thầy Thành, tôi muốn đăng ký ${pkg.name} (${pkg.priceText}) cho ứng dụng Sinh Đề Biến Thể VIP.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                          isHighlight
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/20'
                            : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        Chọn gói này
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Author info & Copyright */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="text-center sm:text-left">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Thông tin bản quyền & Hỗ trợ kỹ thuật:
              </p>
              <p>
                {adminName} – {schoolName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://zalo.me/${zaloPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all text-xs"
              >
                <MessageCircle className="w-4 h-4" />
                💬 Liên hệ Zalo để kích hoạt VIP
              </a>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 dark:bg-slate-800/90 p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Hỗ trợ giáo viên 24/7 qua Zalo {zaloPhone}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm rounded-xl transition-all"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
