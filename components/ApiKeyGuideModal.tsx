import React, { useState, useEffect } from 'react';
import {
  Key,
  ExternalLink,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  HelpCircle,
  Cpu
} from 'lucide-react';
import {
  getApiKey,
  setApiKey as saveApiKey,
  testApiKey,
  getSelectedModel,
  setSelectedModel
} from '../services/geminiService';
import { AVAILABLE_MODELS } from '../constants';

interface ApiKeyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ApiKeyGuideModal: React.FC<ApiKeyGuideModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState(getSelectedModel() || AVAILABLE_MODELS[0].id);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedGuide, setCopiedGuide] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getApiKey() || '';
      setApiKeyInput(current);
      setSelectedModelId(getSelectedModel() || AVAILABLE_MODELS[0].id);
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const guideText = `🔑 HƯỚNG DẪN CÀI ĐẶT API KEY:
• Bước 1: Nhấn "Lấy API Key" để mở trang cung cấp API Key (https://aistudio.google.com/api-keys).
• Bước 2: Đăng nhập tài khoản Google của bạn.
• Bước 3: Chọn "Create API Key / Tạo API Key".
• Bước 4: Sao chép API Key vừa tạo.
• Bước 5: Quay lại ứng dụng → Cài đặt API Key → dán API Key vào ô nhập.
• Bước 6: Nhấn "Lưu API Key" và "Kiểm tra API Key" để bắt đầu sử dụng.`;

  const handleCopyGuide = () => {
    navigator.clipboard.writeText(guideText);
    setCopiedGuide(true);
    setTimeout(() => setCopiedGuide(false), 2000);
  };

  const handleSave = () => {
    const key = apiKeyInput.trim();
    if (!key) {
      setTestResult({ success: false, message: 'Vui lòng dán API Key vào ô nhập.' });
      return;
    }
    saveApiKey(key);
    setSelectedModel(selectedModelId);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    if (onSuccess) onSuccess();
  };

  const handleTestKey = async () => {
    const key = apiKeyInput.trim();
    if (!key) {
      setTestResult({ success: false, message: 'Vui lòng dán API Key trước khi kiểm tra.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const result = await testApiKey(key, selectedModelId);
      if (result.success) {
        saveApiKey(key);
        setSelectedModel(selectedModelId);
        setTestResult({
          success: true,
          message: '✅ API Key đã được kết nối thành công. Bạn có thể bắt đầu sử dụng ứng dụng.',
        });
        if (onSuccess) onSuccess();
      } else {
        setTestResult({
          success: false,
          message: result.error || 'API Key không hợp lệ hoặc đã hết hạn mức sử dụng. Vui lòng kiểm tra lại.',
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e?.message || 'Không thể kết nối đến máy chủ AI. Vui lòng thử lại.',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
              <Key className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">🔑 HƯỚNG DẪN CÀI ĐẶT API KEY</h2>
              <p className="text-xs text-teal-100 font-medium">Kết nối AI sinh đề biến thể — Đơn giản, an toàn & miễn phí</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          
          {/* Guide Steps Box */}
          <div className="bg-teal-50/70 dark:bg-slate-800/60 rounded-xl p-4 border border-teal-200/70 dark:border-teal-900/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-teal-900 dark:text-teal-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                6 Bước cài đặt dễ dàng cho Giáo viên:
              </h3>
              <button
                onClick={handleCopyGuide}
                className="flex items-center gap-1 text-xs px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-teal-100 text-teal-700 dark:text-teal-300 rounded-lg border border-teal-200 dark:border-slate-600 transition-all font-medium"
              >
                {copiedGuide ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedGuide ? 'Đã sao chép!' : '📋 Sao chép hướng dẫn'}
              </button>
            </div>

            <ol className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-normal leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                <span>Nhấn nút <strong className="text-teal-800 dark:text-teal-300">"🔑 Lấy API Key"</strong> bên dưới để mở trang Google AI Studio.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                <span>Đăng nhập bằng tài khoản Gmail của bạn.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                <span>Chọn nút <strong className="text-teal-800 dark:text-teal-300">"Create API Key / Tạo API Key"</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                <span>Sao chép mã API Key (dạng chuỗi ký tự dài bắt đầu bằng <em>AIzaSy...</em>).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">5</span>
                <span>Quay lại ứng dụng, dán mã API Key vào ô nhập bên dưới.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">6</span>
                <span>Nhấn <strong className="text-teal-800 dark:text-teal-300">"💾 Lưu API Key"</strong> và <strong className="text-teal-800 dark:text-teal-300">"🔍 Kiểm tra API Key"</strong> để bắt đầu sử dụng.</span>
              </li>
            </ol>

            <div className="mt-3 pt-3 border-t border-teal-200/50 dark:border-slate-700 flex justify-end">
              <a
                href="https://aistudio.google.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-teal-500/20 transition-all hover:scale-105"
              >
                <ExternalLink className="w-4 h-4" />
                🔑 Lấy API Key miễn phí tại Google AI Studio
              </a>
            </div>
          </div>

          {/* API Key Input Field */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Nhập mã API Key của bạn (Bảo mật trên máy cá nhân)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setTestResult(null);
                }}
                placeholder="Dán mã API Key vào đây (VD: AIzaSy...)"
                className="w-full pl-4 pr-12 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono text-sm outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title={showPassword ? 'Ẩn API Key' : 'Hiện API Key'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              API Key được lưu bảo mật trong trình duyệt của bạn, hoàn toàn không gửi ra ngoài.
            </p>
          </div>

          {/* Model AI Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-teal-600" /> Model AI xử lý
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {AVAILABLE_MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModelId(m.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedModelId === m.id
                      ? 'border-teal-500 bg-teal-50/80 dark:bg-teal-950/40 shadow-sm ring-2 ring-teal-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{m.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                      {m.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Test & Save Status Messages */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs sm:text-sm animate-fade-in ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="font-medium leading-relaxed">{testResult.message}</div>
            </div>
          )}

          {saveSuccess && !testResult && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs sm:text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Đã lưu API Key và Model AI thành công!</span>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs sm:text-sm transition-all"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Button 4: Kiểm tra API Key */}
            <button
              onClick={handleTestKey}
              disabled={testing || !apiKeyInput.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-sky-600/20 transition-all disabled:opacity-50"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {testing ? 'Đang kiểm tra...' : '🔍 Kiểm tra API Key'}
            </button>

            {/* Button 3: Lưu API Key */}
            <button
              onClick={handleSave}
              disabled={!apiKeyInput.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-teal-500/20 transition-all disabled:opacity-50"
            >
              <Key className="w-4 h-4" />
              💾 Lưu API Key
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
