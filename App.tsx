
import React, { useState, useRef, useEffect } from 'react';
import { AppStep, AppMode, InputData, GenerationState, Lesson, Chapter, QuestionConfig, ExtractedQuestion, MatrixTemplate, UserAccount } from './types';
import StepIndicator from './components/StepIndicator';
import Button from './components/Button';
import MarkdownView from './components/MarkdownView';
import SimilarExamPage from './components/SimilarExamPage';
import VariantsExamPage from './components/VariantsExamPage';
import { AdminPortal } from './components/AdminPortal';
import { LoginModal } from './components/LoginModal';
import { ApiKeyGuideModal } from './components/ApiKeyGuideModal';
import { VipPricingModal } from './components/VipPricingModal';

import { generateStep1Matrix, generateStep2Specs, generateStep3Exam, extractInfoFromDocument, convertMatrixFileToHtml, convertMatrixTextToHtml, extractQuestionsFromReference, getApiKey, isValidGoogleAiApiKey, setApiKey as saveApiKey, getSelectedModel, setSelectedModel } from './services/geminiService';
import { parseDocxWithMath } from './services/docxMathParser';
import { exportToDoc } from './services/exportUtils';
import { AVAILABLE_MODELS } from './constants';
import { MATRIX_TEMPLATES } from './services/matrixTemplates';
import { validateAccount, getRegisteredUsers, saveRegisteredUsers, isUserVipActive, deductTrialUsage, saveUserExamDocument, getSystemSettings } from './data/accounts';
import { ArrowRight, ArrowLeft, RotateCcw, FileText, Download, AlertCircle, Upload, Clock, Check, ChevronDown, ChevronRight, Filter, FileUp, Settings, Key, ExternalLink, Sun, Moon, X, Paperclip, Trash2, BookOpen, LogIn, Lock, User, Gift, Phone, Shield, Copy, Shuffle, Sparkles, Layers, Zap, Crown, HelpCircle } from 'lucide-react';


const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.INPUT);
  const [completedSteps, setCompletedSteps] = useState<number>(0);

  // -- App Mode State --
  const [appMode, setAppMode] = useState<AppMode>('variants');

  useEffect(() => {
    localStorage.setItem('examcraft_app_mode', 'variants');
  }, []);

  // -- Data State --
  const [inputData, setInputData] = useState<InputData>({
    subject: '',
    grade: '',
    duration: 45,
    examType: 'Giữa kỳ 1',
    topics: '',
    additionalNotes: '',
    chapters: [],
    questionConfig: {
      type1: { biet: 8, hieu: 4, van_dung: 0, van_dung_cao: 0 },
      type2: { biet: 1, hieu: 1, van_dung: 0, van_dung_cao: 0 },
      type3: { biet: 1, hieu: 1, van_dung: 2, van_dung_cao: 0 },
      essay: { biet: 0, hieu: 0, van_dung: 0, van_dung_cao: 0 },
    }
  });

  // -- Dark Mode State --
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('examcraft_dark_mode') === 'true';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('examcraft_dark_mode', String(darkMode));
  }, [darkMode]);

  // -- Auth & VIP State --
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('examcraft_auth') === 'true';
  });
  const [loggedInUser, setLoggedInUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('examcraft_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Modal triggers
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showApiKeyGuideModal, setShowApiKeyGuideModal] = useState(false);
  const [showVipPricingModal, setShowVipPricingModal] = useState(false);
  const [isOutOfTrialPopup, setIsOutOfTrialPopup] = useState(false);

  // -- Selected Model State --
  const [selectedModel, setSelectedModelState] = useState(getSelectedModel() || AVAILABLE_MODELS[0].id);

  // -- UI State --
  const [variantsResetKey, setVariantsResetKey] = useState(0);
  const [selectedLessonIds, setSelectedLessonIds] = useState<Set<string>>(new Set());
  const [expandedChapterIds, setExpandedChapterIds] = useState<Set<string>>(new Set());

  const [genState, setGenState] = useState<GenerationState>({
    matrix: '',
    specs: '',
    exam: '',
    isLoading: false,
    error: null
  });

  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [matrixTemplate, setMatrixTemplate] = useState<MatrixTemplate>('template1');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const matrixUploadRef = useRef<HTMLInputElement>(null);
  const matrixDirectUploadRef = useRef<HTMLInputElement>(null);
  const referenceUploadRef = useRef<HTMLInputElement>(null);
  const comboMatrixUploadRef = useRef<HTMLInputElement>(null);
  const comboSpecsUploadRef = useRef<HTMLInputElement>(null);

  // -- Combo Shortcut State --
  const [comboMatrixFile, setComboMatrixFile] = useState<File | null>(null);
  const [comboSpecsFile, setComboSpecsFile] = useState<File | null>(null);
  const [isComboProcessing, setIsComboProcessing] = useState(false);

  // -- Reference Document State --
  const [referenceDoc, setReferenceDoc] = useState<{
    text: string;
    images: { base64: string; mimeType: string }[];
    fileName: string;
    method: string;
    wmfCount: number;
  } | null>(null);
  const [isParsingReference, setIsParsingReference] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[]>([]);
  const [isExtractingQuestions, setIsExtractingQuestions] = useState(false);

  // -- API Key State --
  const [apiKey, setApiKeyState] = useState<string>(getApiKey() || '');
  const [apiKeyError, setApiKeyError] = useState<string>('');
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(!getApiKey());
  const [tempApiKey, setTempApiKey] = useState<string>('');

  // --- Auth Handlers ---
  const handleLoginSuccess = (user: UserAccount) => {
    setIsAuthenticated(true);
    setLoggedInUser(user);
    localStorage.setItem('examcraft_auth', 'true');
    localStorage.setItem('examcraft_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoggedInUser(null);
    localStorage.removeItem('examcraft_auth');
    localStorage.removeItem('examcraft_user');
  };

  /**
   * Kiểm tra quyền sử dụng: đã đăng nhập và chưa hết lượt thử hoặc là VIP
   */
  const checkAuthOrTrial = (): boolean => {
    if (!isAuthenticated || !loggedInUser) {
      setShowLoginModal(true);
      return false;
    }
    
    // Nếu là VIP đang còn hạn
    if (isUserVipActive(loggedInUser)) {
      return true;
    }
    
    // Nếu còn lượt dùng thử
    if (loggedInUser.trialCount !== undefined && loggedInUser.trialCount > 0) {
      return true;
    }
    
    // Hết 10 lượt -> Hiển thị hộp thoại VIP & bảng giá
    setIsOutOfTrialPopup(true);
    setShowVipPricingModal(true);
    return false;
  };

  const handleGenerationStart = (featureName = 'Sinh 3 đề biến thể'): boolean => {
    if (!loggedInUser) {
      setShowLoginModal(true);
      return false;
    }
    
    const isAllowed = checkAuthOrTrial();
    if (!isAllowed) return false;

    const result = deductTrialUsage(loggedInUser.username, featureName);
    if (result.success && result.user) {
      setLoggedInUser(result.user);
      localStorage.setItem('examcraft_user', JSON.stringify(result.user));
      return true;
    }
    
    if (!result.success) {
      setIsOutOfTrialPopup(true);
      setShowVipPricingModal(true);
      return false;
    }

    return true;
  };

  const handleGenerationComplete = (col1: string, col2: string, col3: string, fileName: string) => {
    if (!loggedInUser) return;
    
    saveUserExamDocument(loggedInUser.username, {
      name: fileName,
      col1,
      col2,
      col3,
      subject: inputData.subject || 'Tổng hợp',
      grade: inputData.grade || 'THCS',
    });

    const registered = getRegisteredUsers();
    const match = registered.find(u => u.username.toLowerCase() === loggedInUser.username.toLowerCase());
    if (match) {
      setLoggedInUser(match);
      localStorage.setItem('examcraft_user', JSON.stringify(match));
    }
  };

  // --- API Key Handlers ---
  const handleSaveApiKey = () => {
    const key = tempApiKey.trim();
    if (!key) return;
    if (!isValidGoogleAiApiKey(key)) {
      setApiKeyError('API Key không hợp lệ. Vui lòng nhập key bắt đầu bằng AIzaSy... hoặc AQ...');
      return;
    }
    saveApiKey(key);
    setApiKeyState(key);
    setShowApiKeyModal(false);
    setTempApiKey('');
    setApiKeyError('');
  };


  // --- Handlers ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'examType') {
      let newDuration = 45;
      if (value.includes('15 phút')) newDuration = 15;
      else if (value.includes('45 phút')) newDuration = 45;
      else if (value.includes('Giữa') || value.includes('Cuối')) newDuration = 90; // Standard for semesters

      setInputData(prev => ({ ...prev, [name]: value, duration: newDuration }));

      // Auto-filter topics when exam type changes
      if (inputData.chapters.length > 0) {
        applySmartFilter(value, inputData.chapters);
      }

    } else {
      setInputData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingFile(true);
    setUploadedFileName(file.name);
    setGenState(prev => ({ ...prev, error: null }));

    try {
      const extracted = await extractInfoFromDocument(file, inputData.subject, inputData.grade);

      if (!extracted || !extracted.chapters || extracted.chapters.length === 0) {
        throw new Error("AI không tìm thấy thông tin bài học/chủ đề nào trong file này. Hãy đảm bảo file là kế hoạch dạy học (PPCT) hợp lệ.");
      }

      // Fix 3: Validation — cảnh báo nếu AI trả về môn khác với môn đã chọn
      if (inputData.subject && extracted.subject && extracted.subject !== inputData.subject) {
        const aiSubject = extracted.subject;
        const userSubject = inputData.subject;
        // Kiểm tra không phải chỉ khác cách viết (ví dụ: "Công nghệ" vs "Công Nghệ")
        if (aiSubject.toLowerCase().trim() !== userSubject.toLowerCase().trim()) {
          alert(`⚠️ CẢNH BÁO: Bạn đã chọn môn "${userSubject}" nhưng AI phát hiện file này có nội dung môn "${aiSubject}".\n\nVui lòng kiểm tra lại file PPCT đã upload có đúng môn "${userSubject}" không.`);
        }
      }

      setInputData(prev => ({
        ...prev,
        subject: prev.subject || extracted.subject || '',
        grade: prev.grade || extracted.grade || '',
        topics: extracted.topics || prev.topics, // Fallback
        chapters: extracted.chapters || [],
      }));

      // Initialize selection: Expand all chapters, Apply filter
      if (extracted.chapters && extracted.chapters.length > 0) {
        const allChapIds = new Set(extracted.chapters.map(c => c.id));
        setExpandedChapterIds(allChapIds);
        applySmartFilter(inputData.examType, extracted.chapters);
      }

    } catch (err: any) {
      setGenState(prev => ({ ...prev, error: `Lỗi đọc file: ${err.message}` }));
      setUploadedFileName(null);
    } finally {
      setIsAnalyzingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Helper: detect if HTML content mentions essay/tự luận columns
  const detectEssayInHtml = (html: string): boolean => {
    const lowerHtml = html.toLowerCase();
    // Check for explicit essay column headers in the matrix/specs table
    // Mở rộng từ khóa để nhận diện chính xác hơn khi user upload file Ma trận/Đặc tả
    return (
      lowerHtml.includes('tự luận') ||
      lowerHtml.includes('tu luan') ||
      lowerHtml.includes('essay') ||
      lowerHtml.includes('phần iv') ||
      lowerHtml.includes('phan iv') ||
      lowerHtml.includes('phần 4') ||
      /phần\s+iv/i.test(html) ||
      />\s*iv\s*</i.test(html) ||
      /part\s+iv/i.test(html) ||
      lowerHtml.includes('câu tự luận') ||
      lowerHtml.includes('dạng iv') ||
      lowerHtml.includes('(iv)') ||
      lowerHtml.includes('mục iv')
    );
  };

  // Auto-sync questionConfig.essay based on matrix HTML content
  const syncEssayConfigFromMatrix = (matrixHtml: string) => {
    const hasEssay = detectEssayInHtml(matrixHtml);
    if (!hasEssay) {
      console.log('[ExamCraft] Ma trận KHÔNG có tự luận → reset essay config = 0');
      setInputData(prev => ({
        ...prev,
        questionConfig: {
          ...prev.questionConfig,
          essay: { biet: 0, hieu: 0, van_dung: 0, van_dung_cao: 0 },
        }
      }));
    } else {
      console.log('[ExamCraft] Ma trận CÓ tự luận → kiểm tra và set essay config nếu đang = 0');
      // Khi dùng Lối tắt, người dùng không qua bước nhập questionConfig
      // nên essay config có thể vẫn = {0,0,0,0} mặc dù ma trận CÓ tự luận
      // → Tự động set giá trị mặc định hợp lý
      setInputData(prev => {
        const currentEssay = prev.questionConfig.essay;
        const totalEssay = currentEssay.biet + currentEssay.hieu + currentEssay.van_dung + currentEssay.van_dung_cao;
        if (totalEssay === 0) {
          console.log('[ExamCraft] Essay config đang = 0 nhưng Ma trận CÓ tự luận → auto-set default essay config');
          return {
            ...prev,
            questionConfig: {
              ...prev.questionConfig,
              essay: { biet: 0, hieu: 1, van_dung: 1, van_dung_cao: 0 },
            }
          };
        }
        return prev;
      });
    }
  };

  // Common logic for processing uploaded matrix file
  const processMatrixUpload = async (file: File) => {
    setGenState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let content = "";

      // If HTML or Text, read directly
      if (file.type === "text/html" || file.type === "text/plain" || file.name.endsWith(".html") || file.name.endsWith(".txt")) {
        content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsText(file);
        });
      }
      // If DOCX/DOC, extract text via docxMathParser then convert to HTML table via AI
      else if (file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const parsed = await parseDocxWithMath(arrayBuffer);
          console.log(`[MatrixUpload] DOCX parsed: ${parsed.text.length} chars, ${parsed.images.length} images, method=${parsed.method}`);

          // Send extracted text + images to AI for conversion to HTML table
          content = await convertMatrixTextToHtml(parsed.text, parsed.images);
        } catch (docxErr: any) {
          console.warn('[MatrixUpload] DOCX parse failed, trying direct AI:', docxErr);
          // Fallback: try direct AI conversion (works for PDF-like formats)
          content = await convertMatrixFileToHtml(file);
        }
      }
      // If PDF, convert using AI directly (Gemini supports PDF)
      else {
        content = await convertMatrixFileToHtml(file);
      }

      // Auto-detect & sync essay config from the matrix content
      syncEssayConfigFromMatrix(content);

      setGenState(prev => ({ ...prev, matrix: content, isLoading: false }));
      return true;
    } catch (err: any) {
      setGenState(prev => ({ ...prev, isLoading: false, error: err.message }));
      return false;
    }
  };

  const handleMatrixUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processMatrixUpload(file);
    if (matrixUploadRef.current) matrixUploadRef.current.value = '';
  };

  const handleMatrixSkipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const success = await processMatrixUpload(file);
    if (success) {
      // Skip to Matrix Step (Step 2) immediately
      setCurrentStep(AppStep.MATRIX);
      setCompletedSteps(Math.max(completedSteps, 1));
    }

    if (matrixDirectUploadRef.current) matrixDirectUploadRef.current.value = '';
  };

  // -- Combo Shortcut: Upload cả Ma trận + Đặc tả → Nhảy thẳng sang tạo đề --
  const handleComboMatrixSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setComboMatrixFile(file);
    if (comboMatrixUploadRef.current) comboMatrixUploadRef.current.value = '';
  };

  const handleComboSpecsSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setComboSpecsFile(file);
    if (comboSpecsUploadRef.current) comboSpecsUploadRef.current.value = '';
  };

  const processComboShortcut = async () => {
    if (!comboMatrixFile || !comboSpecsFile) {
      alert('Vui lòng chọn cả 2 file: Ma trận VÀ Đặc tả.');
      return;
    }



    setIsComboProcessing(true);
    setGenState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Step 1: Process Matrix file
      const matrixSuccess = await processMatrixUpload(comboMatrixFile);
      if (!matrixSuccess) throw new Error('Không thể xử lý file Ma trận.');

      // Step 2: Process Specs file (same logic)
      let specsContent = '';
      const specsFile = comboSpecsFile;

      if (specsFile.type === 'text/html' || specsFile.type === 'text/plain' || specsFile.name.endsWith('.html') || specsFile.name.endsWith('.txt')) {
        specsContent = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsText(specsFile);
        });
      } else if (specsFile.name.endsWith('.docx') || specsFile.name.endsWith('.doc')) {
        try {
          const arrayBuffer = await specsFile.arrayBuffer();
          const parsed = await parseDocxWithMath(arrayBuffer);
          specsContent = await convertMatrixTextToHtml(parsed.text, parsed.images);
        } catch {
          specsContent = await convertMatrixFileToHtml(specsFile);
        }
      } else {
        specsContent = await convertMatrixFileToHtml(specsFile);
      }

      setGenState(prev => ({ ...prev, specs: specsContent, isLoading: false }));

      // Jump to SPECS step → user clicks "Tạo đề" from there
      setCurrentStep(AppStep.SPECS);
      setCompletedSteps(Math.max(completedSteps, 2));

      // Clear combo state
      setComboMatrixFile(null);
      setComboSpecsFile(null);
    } catch (err: any) {
      setGenState(prev => ({ ...prev, isLoading: false, error: err.message }));
    } finally {
      setIsComboProcessing(false);
    }
  };

  // -- Topic Selection Logic --

  const applySmartFilter = (type: string, chapters: Chapter[]) => {
    const newSelection = new Set<string>();

    chapters.forEach(chap => {
      chap.lessons.forEach(lesson => {
        const end = lesson.weekEnd || 99; // Default to late if unknown
        const start = lesson.weekStart || 0;
        let shouldSelect = false;

        if (type.includes('Giữa kỳ 1')) shouldSelect = end <= 10;
        else if (type.includes('Cuối kỳ 1')) shouldSelect = end <= 18;
        else if (type.includes('Giữa kỳ 2')) shouldSelect = start >= 19 && end <= 27;
        else if (type.includes('Cuối kỳ 2')) shouldSelect = start >= 19; // Chỉ HK2 (tuần 19+)
        else shouldSelect = true; // 15 mins etc (User manual select)

        if (shouldSelect) newSelection.add(lesson.id);
      });
    });
    setSelectedLessonIds(newSelection);
  };

  const toggleChapter = (chapId: string, select: boolean) => {
    const chapter = inputData.chapters.find(c => c.id === chapId);
    if (!chapter) return;

    const newSet = new Set(selectedLessonIds);
    chapter.lessons.forEach(l => {
      if (select) newSet.add(l.id);
      else newSet.delete(l.id);
    });
    setSelectedLessonIds(newSet);
  };

  const toggleLesson = (lessonId: string) => {
    const newSet = new Set(selectedLessonIds);
    if (newSet.has(lessonId)) newSet.delete(lessonId);
    else newSet.add(lessonId);
    setSelectedLessonIds(newSet);
  };

  const toggleExpandChapter = (chapId: string) => {
    const newSet = new Set(expandedChapterIds);
    if (newSet.has(chapId)) newSet.delete(chapId);
    else newSet.add(chapId);
    setExpandedChapterIds(newSet);
  };

  // -- Question Config Logic --
  const updateQuestionConfig = (type: keyof QuestionConfig, level: 'biet' | 'hieu' | 'van_dung' | 'van_dung_cao', value: number) => {
    setInputData(prev => ({
      ...prev,
      questionConfig: {
        ...prev.questionConfig,
        [type]: {
          ...prev.questionConfig[type],
          [level]: Math.max(0, isNaN(value) ? 0 : value)
        }
      }
    }));
  };

  // -- Generation Handlers --

  const handleGenerateMatrix = async () => {
    if (!checkAuthOrTrial()) return;

    if (selectedLessonIds.size === 0) {
      alert("Vui lòng chọn ít nhất 1 bài học/chủ đề!");
      return;
    }

    setGenState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const matrix = await generateStep1Matrix(inputData, selectedLessonIds, matrixTemplate);
      // Sync essay config: nếu matrix sinh ra không có tự luận, reset essay = 0
      syncEssayConfigFromMatrix(matrix);
      setGenState(prev => ({ ...prev, matrix, isLoading: false }));
      setCurrentStep(AppStep.MATRIX);
      setCompletedSteps(Math.max(completedSteps, 1));
    } catch (err: any) {
      setGenState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  };

  const handleGenerateSpecs = async () => {
    if (!checkAuthOrTrial()) return;
    setGenState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const specs = await generateStep2Specs(genState.matrix, inputData, selectedLessonIds, matrixTemplate);
      setGenState(prev => ({ ...prev, specs, isLoading: false }));
      setCurrentStep(AppStep.SPECS);
      setCompletedSteps(Math.max(completedSteps, 2));
    } catch (err: any) {
      setGenState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  };

  const handleGenerateExam = async () => {
    if (!checkAuthOrTrial()) return;

    setGenState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // Double-check: CHỈ force essay = 0 khi CẢ ma trận VÀ đặc tả đều không nhắc "tự luận"
      // Nếu ít nhất 1 trong 2 có tự luận → giữ essay config
      let finalQuestionConfig = { ...inputData.questionConfig };
      const matrixHasEssay = detectEssayInHtml(genState.matrix);
      const specsHasEssay = detectEssayInHtml(genState.specs);

      if (!matrixHasEssay && !specsHasEssay) {
        console.log('[ExamCraft] DOUBLE-CHECK: Ma trận + Đặc tả đều KHÔNG có tự luận → force essay = 0');
        finalQuestionConfig.essay = { biet: 0, hieu: 0, van_dung: 0, van_dung_cao: 0 };
      } else {
        // Ít nhất 1 trong 2 có tự luận → giữ essay config
        // Nếu essay config đang = 0 nhưng phát hiện có tự luận → auto-set
        const totalEssay = finalQuestionConfig.essay.biet + finalQuestionConfig.essay.hieu + finalQuestionConfig.essay.van_dung + finalQuestionConfig.essay.van_dung_cao;
        if (totalEssay === 0) {
          console.log('[ExamCraft] DOUBLE-CHECK: Phát hiện tự luận trong Ma trận/Đặc tả nhưng essay config = 0 → auto-set default');
          finalQuestionConfig.essay = { biet: 0, hieu: 1, van_dung: 1, van_dung_cao: 0 };
        } else {
          console.log(`[ExamCraft] DOUBLE-CHECK: Có tự luận (matrix=${matrixHasEssay}, specs=${specsHasEssay}) → giữ essay config`);
        }
      }

      // Auto-extract questions from reference doc if not done yet
      let questionsToUse = extractedQuestions;
      if (referenceDoc && extractedQuestions.length === 0) {
        console.log('[ExamCraft] Auto-extracting questions from reference doc before exam generation...');
        try {
          const extracted = await extractQuestionsFromReference(
            referenceDoc.text,
            referenceDoc.images,
            genState.specs,
            inputData.subject,
            inputData.grade
          );
          if (extracted.length > 0) {
            setExtractedQuestions(extracted);
            questionsToUse = extracted;
            console.log(`[ExamCraft] Auto-extracted ${extracted.length} questions`);
          }
        } catch (extractErr: any) {
          console.warn('[ExamCraft] Auto-extraction failed, falling back to raw text:', extractErr.message);
        }
      }

      const exam = await generateStep3Exam(
        genState.specs,
        finalQuestionConfig,
        inputData,
        referenceDoc?.text,
        referenceDoc?.images,
        questionsToUse.length > 0 ? questionsToUse : undefined
      );
      setGenState(prev => ({ ...prev, exam, isLoading: false }));
      setCurrentStep(AppStep.EXAM);
      setCompletedSteps(Math.max(completedSteps, 3));


    } catch (err: any) {
      setGenState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  };

  // -- Reference Document Upload Handler --
  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingReference(true);
    setExtractedQuestions([]); // Reset previous extraction
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await parseDocxWithMath(arrayBuffer);

      setReferenceDoc({
        text: result.text,
        images: result.images,
        fileName: file.name,
        method: result.method,
        wmfCount: result.wmfCount,
      });

      console.log(`[Reference] Parsed: ${result.text.length} chars, ${result.images.length} images, method=${result.method}, wmf=${result.wmfCount}`);

      // Auto-trigger AI extraction if specs are available
      if (genState.specs) {
        setIsExtractingQuestions(true);
        try {
          const questions = await extractQuestionsFromReference(
            result.text,
            result.images,
            genState.specs,
            inputData.subject,
            inputData.grade
          );
          setExtractedQuestions(questions);
          console.log(`[Reference] Extracted ${questions.length} questions`);
        } catch (extractErr: any) {
          console.warn('[Reference] Question extraction failed:', extractErr.message);
          // Non-fatal: app still works with raw text fallback
        } finally {
          setIsExtractingQuestions(false);
        }
      }
    } catch (err: any) {
      setGenState(prev => ({ ...prev, error: `Lỗi đọc file tham khảo: ${err.message}` }));
    } finally {
      setIsParsingReference(false);
      if (referenceUploadRef.current) referenceUploadRef.current.value = '';
    }
  };

  const handleDownloadWord = async (content: string, fileName: string) => {
    await exportToDoc(content, fileName);
  };

  // --- Sub-Components for Render ---

  const renderQuestionConfigRow = (
    label: string,
    typeKey: keyof QuestionConfig,
    defaultB: number,
    defaultH: number,
    defaultV: number,
    defaultVC: number = 0
  ) => (
    <div className="grid grid-cols-5 gap-3 items-center py-3 border-b border-teal-50 last:border-0">
      <span className="text-sm font-semibold text-teal-700">{label}</span>
      <div className="flex flex-col">
        <span className="text-xs text-teal-500 mb-1">Biết</span>
        <input
          type="number"
          className="w-full p-2 input-elevated text-center text-sm"
          value={inputData.questionConfig[typeKey].biet}
          onChange={(e) => updateQuestionConfig(typeKey, 'biet', parseInt(e.target.value) || 0)}
          min={0}
        />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-teal-500 mb-1">Hiểu</span>
        <input
          type="number"
          className="w-full p-2 input-elevated text-center text-sm"
          value={inputData.questionConfig[typeKey].hieu}
          onChange={(e) => updateQuestionConfig(typeKey, 'hieu', parseInt(e.target.value) || 0)}
          min={0}
        />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-teal-500 mb-1">Vận dụng</span>
        <input
          type="number"
          className="w-full p-2 input-elevated text-center text-sm"
          value={inputData.questionConfig[typeKey].van_dung}
          onChange={(e) => updateQuestionConfig(typeKey, 'van_dung', parseInt(e.target.value) || 0)}
          min={0}
        />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-teal-500 mb-1">VD cao</span>
        <input
          type="number"
          className="w-full p-2 input-elevated text-center text-sm"
          value={inputData.questionConfig[typeKey].van_dung_cao}
          onChange={(e) => updateQuestionConfig(typeKey, 'van_dung_cao', parseInt(e.target.value) || 0)}
          min={0}
        />
      </div>
    </div>
  );

  const renderInputStep = () => (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 relative z-10">

      {/* === SHORTCUT SECTION (Moved to top) === */}
      <div className="animate-fade-in-up">
        <div className="space-y-4">
          {/* Shortcut 1: Có file Ma trận */}
          <div className="shortcut-box p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-blue-800">⚡ Lối tắt: Bạn đã có file Ma trận?</h3>
              <p className="text-sm text-blue-600">Tải lên file Ma trận (HTML, Word, PDF) để bỏ qua các bước cấu hình và sinh ngay Bảng đặc tả.</p>
            </div>
            <input
              type="file"
              ref={matrixDirectUploadRef}
              onChange={handleMatrixSkipUpload}
              className="hidden"
              accept=".html,.txt,.pdf,.docx,.doc"
            />
            <Button
              variant="secondary"
              onClick={() => matrixDirectUploadRef.current?.click()}
              icon={<FileUp className="w-4 h-4" />}
              className="whitespace-nowrap"
              isLoading={genState.isLoading && currentStep === AppStep.INPUT && !isComboProcessing}
            >
              Upload Ma trận & Đi tiếp
            </Button>
          </div>

          {/* Shortcut 2: Có cả Ma trận + Đặc tả */}
          <div className="shortcut-box p-5" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)' }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-emerald-800">🚀 Lối tắt: Bạn đã có file Ma trận + Đặc tả?</h3>
                <p className="text-sm text-emerald-600">Tải lên cả 2 file để nhảy thẳng sang bước tạo đề thi!</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* Upload Ma trận */}
              <input type="file" ref={comboMatrixUploadRef} onChange={handleComboMatrixSelect} className="hidden" accept=".html,.txt,.pdf,.docx,.doc" />
              <button
                onClick={() => comboMatrixUploadRef.current?.click()}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed transition-all text-left ${comboMatrixFile
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30'
                  }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${comboMatrixFile ? 'bg-emerald-100' : 'bg-slate-100'
                  }`}>
                  {comboMatrixFile ? <Check className="w-5 h-5 text-emerald-600" /> : <FileUp className="w-5 h-5 text-slate-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${comboMatrixFile ? 'text-emerald-700' : 'text-slate-600'}`}>
                    {comboMatrixFile ? comboMatrixFile.name : '📋 Chọn file Ma trận'}
                  </p>
                  <p className="text-xs text-slate-400">{comboMatrixFile ? 'Đã chọn · Click để đổi' : 'HTML, Word, PDF'}</p>
                </div>
              </button>

              {/* Upload Đặc tả */}
              <input type="file" ref={comboSpecsUploadRef} onChange={handleComboSpecsSelect} className="hidden" accept=".html,.txt,.pdf,.docx,.doc" />
              <button
                onClick={() => comboSpecsUploadRef.current?.click()}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed transition-all text-left ${comboSpecsFile
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30'
                  }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${comboSpecsFile ? 'bg-emerald-100' : 'bg-slate-100'
                  }`}>
                  {comboSpecsFile ? <Check className="w-5 h-5 text-emerald-600" /> : <FileUp className="w-5 h-5 text-slate-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${comboSpecsFile ? 'text-emerald-700' : 'text-slate-600'}`}>
                    {comboSpecsFile ? comboSpecsFile.name : '📝 Chọn file Đặc tả'}
                  </p>
                  <p className="text-xs text-slate-400">{comboSpecsFile ? 'Đã chọn · Click để đổi' : 'HTML, Word, PDF'}</p>
                </div>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-emerald-500 italic">
                {comboMatrixFile && comboSpecsFile
                  ? '✅ Đã chọn đủ 2 file — Nhấn nút để xử lý'
                  : `⏳ Còn thiếu: ${!comboMatrixFile ? 'Ma trận' : ''}${!comboMatrixFile && !comboSpecsFile ? ' + ' : ''}${!comboSpecsFile ? 'Đặc tả' : ''}`
                }
              </p>
              <Button
                onClick={processComboShortcut}
                disabled={!comboMatrixFile || !comboSpecsFile}
                isLoading={isComboProcessing}
                icon={<ArrowRight className="w-4 h-4" />}
                className="whitespace-nowrap"
              >
                Xử lý & Tạo đề thi
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-teal-100/60"></div></div>
        <span className="relative bg-white px-4 py-1 text-xs font-bold text-teal-500 uppercase tracking-wider rounded-full border border-teal-100">Hoặc bắt đầu từ đầu</span>
      </div>

      {/* 1. Basic Info & Upload */}
      <div className="card-elevated p-6 sm:p-8 animate-fade-in-up">
        <h2 className="text-xl font-bold text-teal-800 mb-6 flex items-center gap-2.5">
          <span className="badge-section text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">1</span>
          Thông tin chung & Upload PPCT
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-teal-700 mb-2">Môn học</label>
            <select
              name="subject"
              value={isCustomSubject ? '__custom__' : inputData.subject}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setIsCustomSubject(true);
                  setInputData(prev => ({ ...prev, subject: '' }));
                } else {
                  setIsCustomSubject(false);
                  handleInputChange(e);
                }
              }}
              className="w-full p-3 input-elevated focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">-- Chọn môn học --</option>
              <option value="Toán học">Toán học</option>
              <option value="Ngữ văn">Ngữ văn</option>
              <option value="Tiếng Anh">Tiếng Anh</option>
              <option value="Vật lí">Vật lí</option>
              <option value="Hóa học">Hóa học</option>
              <option value="Sinh học">Sinh học</option>
              <option value="Lịch sử">Lịch sử</option>
              <option value="Địa lí">Địa lí</option>
              <option value="Tin học">Tin học</option>
              <option value="Công nghệ">Công nghệ</option>
              <option value="Giáo dục công dân">Giáo dục công dân (GD KT&PL)</option>
              <option value="Giáo dục thể chất">Giáo dục thể chất</option>
              <option value="Âm nhạc">Âm nhạc</option>
              <option value="Mỹ thuật">Mỹ thuật</option>
              <option value="Khoa học tự nhiên">Khoa học tự nhiên</option>
              <option value="Lịch sử và Địa lí">Lịch sử và Địa lí</option>
              <option value="Hoạt động trải nghiệm">Hoạt động trải nghiệm, hướng nghiệp</option>
              <option value="__custom__">✏️ Nhập môn khác...</option>
            </select>
            {isCustomSubject && (
              <input
                type="text"
                name="subject"
                value={inputData.subject}
                onChange={handleInputChange}
                placeholder="Nhập tên môn học của bạn..."
                className="w-full p-3 mt-2 input-elevated focus:ring-2 focus:ring-primary outline-none"
                autoFocus
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-teal-700 mb-2">Khối lớp</label>
            <select name="grade" value={inputData.grade} onChange={handleInputChange} className="w-full p-3 input-elevated focus:ring-2 focus:ring-primary outline-none">
              <option value="">-- Chọn khối lớp --</option>
              <option value="1">Lớp 1</option>
              <option value="2">Lớp 2</option>
              <option value="3">Lớp 3</option>
              <option value="4">Lớp 4</option>
              <option value="5">Lớp 5</option>
              <option value="6">Lớp 6</option>
              <option value="7">Lớp 7</option>
              <option value="8">Lớp 8</option>
              <option value="9">Lớp 9</option>
              <option value="10">Lớp 10</option>
              <option value="11">Lớp 11</option>
              <option value="12">Lớp 12</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-teal-700 mb-2">Loại kiểm tra (Auto Filter)</label>
            <select name="examType" value={inputData.examType} onChange={handleInputChange} className="w-full p-3 input-elevated focus:ring-2 focus:ring-primary outline-none">
              <option>Kiểm tra 15 phút</option>
              <option>Kiểm tra 45 phút</option>
              <option>Giữa kỳ 1</option>
              <option>Cuối kỳ 1</option>
              <option>Giữa kỳ 2</option>
              <option>Cuối kỳ 2</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-teal-700 mb-2">Thời gian (phút)</label>
            <div className="relative">
              <input type="number" name="duration" value={inputData.duration} onChange={handleInputChange} className="w-full p-3 pl-10 input-elevated focus:ring-2 focus:ring-primary outline-none" />
              <Clock className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>
        </div>

        <div className="p-5 upload-zone text-center relative">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.docx,.doc" className="hidden" id="file-upload" disabled={isAnalyzingFile} />
          <label htmlFor="file-upload" className={`cursor-pointer flex flex-col items-center justify-center ${isAnalyzingFile ? 'opacity-50' : ''}`}>
            {isAnalyzingFile ? (
              <div className="flex items-center gap-2 text-primary font-medium"><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> Đang phân tích...</div>
            ) : uploadedFileName ? (
              <div className="flex items-center gap-2 text-green-700 font-medium"><Check className="w-5 h-5" /> {uploadedFileName} (Click thay đổi)</div>
            ) : (
              <div className="flex items-center gap-2 text-primary font-medium"><Upload className="w-5 h-5" /> Upload File PPCT (.pdf, .docx)</div>
            )}
          </label>
          <p className="text-xs text-slate-500 mt-2 italic">📌 Hỗ trợ file <strong>.pdf</strong> và <strong>.docx</strong> (Word). Công thức toán MathType sẽ được tự động trích xuất.</p>
        </div>
      </div>

      {/* === MATRIX TEMPLATE SELECTOR === */}
      <div className="card-elevated p-6 sm:p-8 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <h2 className="text-xl font-bold text-teal-800 mb-4 flex items-center gap-2.5">
          <span className="badge-section text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">✦</span>
          Chọn mẫu Ma trận – Đặc tả
        </h2>
        <p className="text-sm text-slate-500 mb-4">Chọn mẫu format bảng Ma trận & Đặc tả mà AI sẽ sinh ra.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MATRIX_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => setMatrixTemplate(tmpl.id)}
              className={`relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left group ${matrixTemplate === tmpl.id
                ? 'border-teal-500 bg-teal-50 shadow-md shadow-teal-100'
                : 'border-slate-200 hover:border-teal-300 hover:bg-teal-50/30'
                }`}
            >
              {/* Radio indicator */}
              <div className="absolute top-3 right-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${matrixTemplate === tmpl.id ? 'border-teal-500 bg-teal-500' : 'border-slate-300'
                  }`}>
                  {matrixTemplate === tmpl.id && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>
              {/* Content */}
              <span className="text-2xl mb-2">{tmpl.icon}</span>
              <span className="text-sm font-bold text-teal-800 pr-6">{tmpl.name}</span>
              <span className="text-xs text-slate-500 mt-1 leading-relaxed">{tmpl.description}</span>
              {tmpl.badge && (
                <span className="mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">{tmpl.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Topic Selection Tree */}
      {inputData.chapters.length > 0 && (
        <div className="card-elevated p-6 sm:p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-teal-800 flex items-center gap-2.5">
              <span className="badge-section text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              Chọn chủ đề trọng tâm
            </h2>
            <div className="flex gap-2 text-xs">
              <button onClick={() => applySmartFilter(inputData.examType, inputData.chapters)} className="flex items-center gap-1 text-primary hover:bg-teal-50 px-2 py-1 rounded"><Filter className="w-3 h-3" /> Lọc theo kỳ</button>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-teal-100 shadow-sm">
            {inputData.chapters.map(chap => {
              const isExpanded = expandedChapterIds.has(chap.id);
              const activeLessonCount = chap.lessons.filter(l => selectedLessonIds.has(l.id)).length;
              const isFullSelected = activeLessonCount === chap.lessons.length;
              const isPartSelected = activeLessonCount > 0 && !isFullSelected;

              return (
                <div key={chap.id} className="border-b border-slate-100 last:border-0">
                  {/* Chapter Header */}
                  <div className="flex items-center bg-teal-50/40 p-3 chapter-row">
                    <button onClick={() => toggleExpandChapter(chap.id)} className="p-1 mr-2 text-slate-500">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <input
                      type="checkbox"
                      className="w-4 h-4 mr-3 text-primary rounded focus:ring-primary"
                      checked={isFullSelected}
                      ref={el => { if (el) el.indeterminate = isPartSelected; }}
                      onChange={(e) => toggleChapter(chap.id, e.target.checked)}
                    />
                    <div className="flex-1 font-semibold text-sm text-teal-800">
                      {chap.name}
                    </div>
                    <span className="text-xs chip-teal px-2 py-0.5 text-teal-700 ml-2">
                      {chap.totalPeriods} tiết
                    </span>
                  </div>

                  {/* Lessons List */}
                  {isExpanded && (
                    <div className="pl-12 pr-4 py-2 space-y-1 bg-white">
                      {chap.lessons.map(lesson => (
                        <div key={lesson.id} className="flex items-center p-2 hover:bg-teal-50 rounded group">
                          <input
                            type="checkbox"
                            className="w-4 h-4 mr-3 text-primary rounded focus:ring-primary"
                            checked={selectedLessonIds.has(lesson.id)}
                            onChange={() => toggleLesson(lesson.id)}
                          />
                          <div className="flex-1 text-sm text-teal-700">
                            {lesson.name}
                          </div>
                          <div className="flex gap-2 opacity-70 group-hover:opacity-100">
                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{lesson.periods} tiết</span>
                            {lesson.weekEnd && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Tuần {lesson.weekStart}-{lesson.weekEnd}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-between items-center text-sm text-teal-700 chip-teal p-3">
            <span>Đã chọn: <strong className="text-primary">{selectedLessonIds.size}</strong> bài học</span>
          </div>
        </div>
      )}

      {/* 3. Question Configuration */}
      <div className="card-elevated p-6 sm:p-8 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <h2 className="text-xl font-bold text-teal-800 mb-6 flex items-center gap-2.5">
          <span className="badge-section text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">3</span>
          Cấu trúc đề thi (Số lượng câu hỏi)
        </h2>
        <div className="config-table">
          {renderQuestionConfigRow("Dạng I (4 lựa chọn)", "type1", 8, 4, 0)}
          {renderQuestionConfigRow("Dạng II (Đúng/Sai)", "type2", 1, 1, 0)}
          {renderQuestionConfigRow("Dạng III (Trả lời ngắn)", "type3", 1, 1, 2)}
          {renderQuestionConfigRow("Tự luận", "essay", 0, 1, 2)}
        </div>
      </div>

      <div className="pt-6 flex justify-end">
        <Button
          onClick={handleGenerateMatrix}
          isLoading={genState.isLoading}
          disabled={selectedLessonIds.size === 0}
          icon={<ArrowRight className="w-5 h-5" />}
          className="w-full sm:w-auto px-8 py-3 text-lg shadow-lg shadow-teal-100"
        >
          Tạo Ma trận đề thi
        </Button>
      </div>

    </div>
  );

  const renderContentStep = (
    title: string,
    content: string,
    onNext: () => void,
    nextLabel: string,
    isLastStep: boolean = false,
    onUpdateContent: (val: string) => void
  ) => (
    <div className="max-w-[1400px] mx-auto h-full flex flex-col p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4 card-elevated p-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-teal-800 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full badge-section text-white flex items-center justify-center text-sm shrink-0 font-bold">
            {currentStep + 1}
          </span>
          {title}
        </h2>
        <div className="flex gap-3">
          {/* Upload Matrix Button - Only for Matrix Step */}
          {currentStep === AppStep.MATRIX && (
            <>
              <input
                type="file"
                ref={matrixUploadRef}
                onChange={handleMatrixUpload}
                className="hidden"
                accept=".html,.txt,.pdf,.docx,.doc"
              />
              <Button
                variant="secondary"
                onClick={() => matrixUploadRef.current?.click()}
                icon={<Upload className="w-4 h-4" />}
                isLoading={genState.isLoading}
              >
                Upload Ma trận
              </Button>
            </>
          )}

          <Button variant="secondary" onClick={() => handleDownloadWord(content, title)} icon={<FileText className="w-4 h-4" />}>
            Tải Word (.docx)
          </Button>

          <Button variant="secondary" onClick={() => {
            const blob = new Blob([content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}.html`;
            a.click();
          }} icon={<Download className="w-4 h-4" />}>
            Tải HTML
          </Button>
          {!isLastStep && (
            <Button onClick={onNext} isLoading={genState.isLoading} icon={<ArrowRight className="w-4 h-4" />}>
              {nextLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Reference Document Upload - Only for SPECS step */}
      {currentStep === AppStep.SPECS && (
        <div className="mb-4 card-elevated p-4 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-bold text-teal-800">Tài liệu tham khảo — Ngân hàng câu hỏi</span>
            <span className="text-xs text-slate-400">(tùy chọn)</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Upload đề mẫu hoặc ngân hàng câu hỏi (.docx) — AI sẽ <strong>trích xuất chính xác</strong> các câu hỏi và sử dụng nguyên văn vào đề thi (phù hợp với ma trận, đặc tả).
          </p>

          <input
            type="file"
            ref={referenceUploadRef}
            onChange={handleReferenceUpload}
            className="hidden"
            accept=".docx,.doc,.pdf"
          />

          {!referenceDoc ? (
            <button
              onClick={() => referenceUploadRef.current?.click()}
              disabled={isParsingReference}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-teal-200 rounded-lg hover:border-teal-400 hover:bg-teal-50/50 transition-all text-sm text-teal-600 w-full justify-center"
            >
              {isParsingReference ? (
                <>
                  <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                  <span>Đang phân tích tài liệu...</span>
                </>
              ) : (
                <>
                  <Paperclip className="w-4 h-4" />
                  <span>Chọn file đề mẫu / ngân hàng câu hỏi (.docx, .pdf)</span>
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              {/* File Info Row */}
              <div className="flex items-center gap-3 px-4 py-2.5 bg-teal-50 border border-teal-200 rounded-lg">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-teal-800 truncate">{referenceDoc.fileName}</p>
                  <p className="text-xs text-slate-500">
                    {referenceDoc.method === 'hybrid'
                      ? `Hybrid: ${referenceDoc.wmfCount} công thức MathType + ${referenceDoc.images.length} hình`
                      : referenceDoc.method === 'xml'
                        ? `XML: ${referenceDoc.text.length} ký tự (OMML → LaTeX)`
                        : `Mammoth: ${referenceDoc.images.length} hình ảnh`
                    }
                    {' · '}{Math.round(referenceDoc.text.length / 1000)}K ký tự
                  </p>
                </div>
                <button
                  onClick={() => { setReferenceDoc(null); setExtractedQuestions([]); }}
                  className="shrink-0 p-1.5 rounded-md hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"
                  title="Xóa tài liệu tham khảo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Extraction Status */}
              {isExtractingQuestions && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-amber-700 font-medium">Đang trích xuất câu hỏi bằng AI...</span>
                </div>
              )}

              {/* Extracted Questions Summary */}
              {extractedQuestions.length > 0 && !isExtractingQuestions && (
                <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-800">
                      Đã trích xuất {extractedQuestions.length} câu hỏi
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {(() => {
                      const byType = {
                        type1: extractedQuestions.filter(q => q.type === 'type1').length,
                        type2: extractedQuestions.filter(q => q.type === 'type2').length,
                        type3: extractedQuestions.filter(q => q.type === 'type3').length,
                        essay: extractedQuestions.filter(q => q.type === 'essay').length,
                      };
                      return (
                        <>
                          {byType.type1 > 0 && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md">Dạng I: {byType.type1} câu</span>}
                          {byType.type2 > 0 && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md">Dạng II: {byType.type2} câu</span>}
                          {byType.type3 > 0 && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md">Dạng III: {byType.type3} câu</span>}
                          {byType.essay > 0 && <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-md">Tự luận: {byType.essay} câu</span>}
                        </>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-emerald-600 mt-2 italic">
                    ✅ Các câu hỏi này sẽ được sử dụng NGUYÊN VĂN trong đề thi (phù hợp ma trận + đặc tả).
                  </p>
                </div>
              )}

              {/* No questions extracted */}
              {referenceDoc && !isExtractingQuestions && extractedQuestions.length === 0 && (
                <p className="text-xs text-slate-400 italic px-1">
                  ⏳ Câu hỏi sẽ được trích xuất khi bạn nhấn "Tạo đề thi". Hoặc AI sẽ tham khảo nội dung trực tiếp.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6 pb-2">
        {/* Editor Side */}
        <div className="flex flex-col h-full panel-elevated">
          <div className="bg-slate-50/80 px-4 py-2.5 border-b border-teal-100/50 flex-shrink-0 flex justify-between items-center">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Source Code (HTML/Markdown)</label>
          </div>
          <textarea
            className="flex-1 w-full p-4 font-mono text-xs sm:text-sm focus:outline-none resize-none leading-relaxed text-slate-800 bg-slate-50"
            value={content}
            onChange={(e) => onUpdateContent(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Preview Side */}
        <div className="flex flex-col h-full panel-elevated">
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 px-4 py-2.5 border-b border-teal-100/50 flex-shrink-0">
            <label className="text-xs font-bold text-primary uppercase tracking-wider">Xem trước</label>
          </div>
          <div className="flex-1 overflow-auto bg-white p-2">
            <MarkdownView content={content} />
          </div>
        </div>
      </div>
    </div>
  );

  const handleReset = () => {
    if (window.confirm("Tạo mới sẽ xóa toàn bộ dữ liệu hiện tại?")) {
      setInputData({
        subject: '', grade: '', duration: 45, examType: 'Giữa kỳ 1', topics: '', additionalNotes: '',
        chapters: [],
        questionConfig: {
          type1: { biet: 8, hieu: 4, van_dung: 0, van_dung_cao: 0 },
          type2: { biet: 1, hieu: 1, van_dung: 0, van_dung_cao: 0 },
          type3: { biet: 1, hieu: 1, van_dung: 2, van_dung_cao: 0 },
          essay: { biet: 0, hieu: 0, van_dung: 0, van_dung_cao: 0 },
        }
      });
      setUploadedFileName(null);
      setIsCustomSubject(false);
      setCurrentStep(AppStep.INPUT);
      setCompletedSteps(0);
      setSelectedLessonIds(new Set());
      setExpandedChapterIds(new Set());
      setMatrixTemplate('template1');
      setReferenceDoc(null);
      setExtractedQuestions([]);
      setComboMatrixFile(null);
      setComboSpecsFile(null);
    }
  }

  if (loggedInUser?.username === 'Admin') {
    return <AdminPortal onLogout={handleLogout} />;
  }

  return (
    <div className="h-screen w-full flex flex-col bg-app-gradient font-sans text-black overflow-hidden">

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* API Key 6-Step Guide Modal */}
      <ApiKeyGuideModal
        isOpen={showApiKeyGuideModal}
        onClose={() => setShowApiKeyGuideModal(false)}
        onSuccess={() => {
          setApiKeyState(getApiKey() || '');
          setShowApiKeyGuideModal(false);
        }}
      />

      {/* VIP Pricing & Out of Trial Modal */}
      <VipPricingModal
        isOpen={showVipPricingModal}
        onClose={() => {
          setShowVipPricingModal(false);
          setIsOutOfTrialPopup(false);
        }}
        isOutOfTrial={isOutOfTrialPopup}
      />

      {/* Header */}
      <header className="glass-header shrink-0 z-20">
        <div className="max-w-[1700px] mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo & Title & Copyright */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 badge-section rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md">
              AI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-teal-950 dark:text-teal-100 leading-tight">
                  SINH ĐỀ BIẾN THỂ VIP
                </h1>
                <span className="text-[10px] bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                  CV 7991
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Bản quyền: <strong>Thầy giáo Đinh Văn Thành</strong> – Trường THCS Đồng Yên, tỉnh Tuyên Quang · ĐT/Zalo: <strong>0915.213717</strong>
              </p>
            </div>
          </div>

          {/* Auth & Trial Badge & Navigation Action Buttons */}
          <div className="flex items-center gap-2.5">
            
            {/* User Account / Trial Status Badge */}
            {isAuthenticated && loggedInUser ? (
              <div className="flex items-center gap-2">
                {isUserVipActive(loggedInUser) ? (
                  <button
                    onClick={() => {
                      setIsOutOfTrialPopup(false);
                      setShowVipPricingModal(true);
                    }}
                    className="flex items-center gap-1 text-xs bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1.5 rounded-full font-black shadow-sm transition-all hover:scale-105"
                    title="Tài khoản VIP — Nhấn để xem quyền lợi"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>
                      {loggedInUser.vipPackage === 'permanent'
                        ? '👑 VIP Vĩnh viễn'
                        : `👑 VIP ${loggedInUser.vipExpiryYear ? `(${loggedInUser.vipExpiryYear})` : ''}`}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                        (loggedInUser.trialCount ?? 0) > 3
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                          : (loggedInUser.trialCount ?? 0) > 0
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 animate-pulse'
                          : 'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300'
                      }`}
                    >
                      <Gift className="w-3.5 h-3.5" />
                      {(loggedInUser.trialCount ?? 0) > 0
                        ? `Bạn còn ${loggedInUser.trialCount}/10 lượt dùng thử`
                        : 'Hết 10 lượt dùng thử'}
                    </span>
                    {(loggedInUser.trialCount ?? 0) <= 3 && (
                      <button
                        onClick={() => {
                          setIsOutOfTrialPopup(false);
                          setShowVipPricingModal(true);
                        }}
                        className="text-[11px] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black px-2.5 py-1 rounded-lg shadow-sm transition-all"
                      >
                        👑 Nâng VIP
                      </button>
                    )}
                  </div>
                )}

                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden md:inline">
                  👤 {loggedInUser.name}
                </span>

                <button
                  onClick={handleLogout}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Đăng xuất tài khoản"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer shadow-sm hover:scale-105 bg-gradient-to-r from-teal-500 to-emerald-500 text-white border border-teal-400"
                title="Nhấn để đăng nhập hoặc đăng ký dùng thử 10 lượt"
              >
                <LogIn className="w-3.5 h-3.5" />
                🎁 Đăng ký dùng thử (10 lượt) · Đăng nhập
              </button>
            )}

            {/* VIP Pricing Button */}
            <button
              onClick={() => {
                setIsOutOfTrialPopup(false);
                setShowVipPricingModal(true);
              }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 h-9 rounded-xl font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 transition-all"
              title="Bảng giá các gói VIP"
            >
              <Crown className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Gói VIP</span>
            </button>

            {/* API Key Guide Button */}
            <button
              onClick={() => setShowApiKeyGuideModal(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 h-9 rounded-xl font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800 hover:bg-teal-100 transition-all"
              title="Hướng dẫn & Cài đặt API Key"
            >
              <Key className="w-4 h-4 text-teal-600" />
              <span className="hidden sm:inline">API Key</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(prev => !prev)}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? 'Chuyển sang Giao diện sáng' : 'Chuyển sang Giao diện tối'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Create new button */}
            <Button
              variant="secondary"
              onClick={() => {
                if (window.confirm("Tạo mới sẽ xóa toàn bộ dữ liệu làm việc hiện tại?")) {
                  setVariantsResetKey(prev => prev + 1);
                }
              }}
              icon={<RotateCcw className="w-4 h-4" />}
              className="text-xs px-3 py-1.5 h-9"
            >
              Tạo mới
            </Button>

          </div>
        </div>
      </header>


      {/* Progress — chỉ hiển thị cho mode CV 7991 */}
      {appMode === 'cv7991' && (
        <div className="shrink-0">
          <StepIndicator currentStep={currentStep} setStep={setCurrentStep} completedSteps={completedSteps} />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 relative w-full overflow-hidden">

        {/* ===== HOME LANDING — 3 MODE CARDS ===== */}
        {appMode === 'home' && (
          <div className="absolute inset-0 overflow-y-auto">
            <div className="min-h-full flex flex-col items-center justify-center px-4 py-10 sm:py-16">
              {/* Hero Title */}
              <div className="text-center mb-10 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-50 border border-teal-200 rounded-full text-sm font-medium text-teal-700 mb-4">
                  <Sparkles className="w-4 h-4" />
                  Powered by Google Gemini AI
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                  Chọn chế độ <span className="bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">tạo đề thi</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto">
                  3 công cụ AI mạnh mẽ giúp soạn đề chỉ trong vài phút
                </p>
              </div>

              {/* 3 Mode Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">

                {/* Card 1: CV 7991 — TEAL */}
                <div className="mode-card mode-card-teal card-stagger-1" onClick={() => setAppMode('cv7991')}>
                  <div className="particle" style={{ width: 8, height: 8, background: '#14b8a6', top: '15%', right: '20%', animationDelay: '0s' }} />
                  <div className="particle" style={{ width: 6, height: 6, background: '#0d9488', bottom: '25%', left: '15%', animationDelay: '1.5s' }} />
                  <div className="mode-card-icon">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-extrabold text-teal-900 mb-2">Tạo đề theo CV 7991</h3>
                  <p className="text-sm text-teal-700/70 mb-5 leading-relaxed">
                    Pipeline 4 bước chuẩn: Nhập liệu → Ma trận → Đặc tả → Đề thi hoàn chỉnh
                  </p>
                  <div className="space-y-1.5 mb-6">
                    <div className="mode-card-feature"><div className="dot" style={{ background: '#0d9488' }} /><span>Upload PPCT tự động nhận diện</span></div>
                    <div className="mode-card-feature"><div className="dot" style={{ background: '#0d9488' }} /><span>4 dạng câu hỏi chuẩn CV 7991</span></div>
                    <div className="mode-card-feature"><div className="dot" style={{ background: '#0d9488' }} /><span>Lối tắt nhanh nếu có sẵn Ma trận</span></div>
                    <div className="mode-card-feature"><div className="dot" style={{ background: '#0d9488' }} /><span>Xuất Word / HTML</span></div>
                  </div>
                  <button className="mode-card-btn" onClick={(e) => { e.stopPropagation(); setAppMode('cv7991'); }}>
                    <Zap className="w-4 h-4" />
                    Bắt đầu
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Card 2: Tạo đề tương tự — BLUE */}
                <div className="mode-card mode-card-blue card-stagger-2" onClick={() => setAppMode('similar')}>
                  <div className="particle" style={{ width: 8, height: 8, background: '#3b82f6', top: '20%', left: '25%', animationDelay: '0.5s' }} />
                  <div className="particle" style={{ width: 6, height: 6, background: '#2563eb', bottom: '15%', right: '20%', animationDelay: '2s' }} />
                  <div className="mode-card-icon">
                    <Copy className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-extrabold text-blue-900 mb-2">Tạo đề tương tự</h3>
                  <p className="text-sm text-blue-700/70 mb-5 leading-relaxed">
                    Upload 1 đề mẫu → AI phân tích cấu trúc & sinh đề mới giữ nguyên format
                  </p>
                  <div className="space-y-1.5 mb-6">
                    <div className="mode-card-feature"><div className="dot" style={{ background: '#2563eb' }} /><span>Phân tích ma trận tự động</span></div>
                    <div className="mode-card-feature"><div className="dot" style={{ background: '#2563eb' }} /><span>Giữ cấu trúc, thay số liệu</span></div>
                    <div className="mode-card-feature"><div className="dot" style={{ background: '#2563eb' }} /><span>Lời giải chi tiết kèm theo</span></div>
                    <div className="mode-card-feature"><div className="dot" style={{ background: '#2563eb' }} /><span>Hỗ trợ PDF & ảnh chụp</span></div>
                  </div>
                  <button className="mode-card-btn" onClick={(e) => { e.stopPropagation(); setAppMode('similar'); }}>
                    <Layers className="w-4 h-4" />
                    Bắt đầu
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Card 3: Sinh 3 đề biến thể — PURPLE */}
                <div className="mode-card mode-card-purple card-stagger-3" onClick={() => setAppMode('variants')}>
                  <div className="particle" style={{ width: 8, height: 8, background: '#8b5cf6', top: '10%', right: '15%', animationDelay: '1s' }} />
                  <div className="particle" style={{ width: 6, height: 6, background: '#7c3aed', bottom: '20%', left: '10%', animationDelay: '2.5s' }} />
                  <div className="mode-card-icon">
                    <Shuffle className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-extrabold text-purple-900 mb-2">Sinh 3 đề biến thể</h3>
                  <p className="text-sm text-purple-700/70 mb-5 leading-relaxed">
                    Upload 1 đề gốc → AI tự động sinh 3 đề khác nhau kèm đáp án chi tiết
                  </p>
                  <div className="space-y-1.5 mb-6">
                    <div className="mode-card-feature"><div className="dot" style={{ background: '#7c3aed' }} /><span>3 đề biến thể từ 1 gốc</span></div>
                    <div className="mode-card-feature"><div className="dot" style={{ background: '#7c3aed' }} /><span>Streaming thời gian thực</span></div>
                    <div className="mode-card-feature"><div className="dot" style={{ background: '#7c3aed' }} /><span>Đáp án chi tiết cho câu khó</span></div>
                    <div className="mode-card-feature"><div className="dot" style={{ background: '#7c3aed' }} /><span>Xuất 1 file Word gộp 3 đề</span></div>
                  </div>
                  <button className="mode-card-btn" onClick={(e) => { e.stopPropagation(); setAppMode('variants'); }}>
                    <Sparkles className="w-4 h-4" />
                    Bắt đầu
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>

              {/* Login Section on Home Page */}
              {!isAuthenticated && (
                <div className="mt-10 max-w-md w-full animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                  <div className="card-elevated p-6 text-center border border-teal-100 dark:border-teal-900/50">
                    <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-tr from-teal-600 to-emerald-500 shadow-md shadow-teal-600/20">
                      <Gift className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-black text-teal-900 dark:text-teal-200 mb-1">
                      🎁 Trải nghiệm 10 Lượt Dùng Thử Miễn Phí
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                      Mỗi thiết bị được tặng <strong>10 lượt sử dụng đầy đủ mọi tính năng</strong> sinh đề, ma trận và xuất file Word chuẩn 100%.
                    </p>
                    <button
                      onClick={() => setShowLoginModal(true)}
                      className="w-full py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 text-sm hover:shadow-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-600/25"
                    >
                      <Sparkles className="w-4 h-4" />
                      Đăng ký dùng thử / Đăng nhập ngay
                    </button>
                    <p className="text-[11px] text-slate-400 mt-3.5">
                      Kích hoạt VIP liên hệ: <strong>Thầy Đinh Thành – Zalo 0915.213717</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== MODE: CV 7991 (Pipeline gốc) ===== */}
        {appMode === 'cv7991' && (
          <>
            {/* Error Toast */}
            {genState.error && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-100 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 max-w-xl animate-fade-in-up">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm flex-1">{genState.error}</span>
                <button onClick={() => setGenState(prev => ({ ...prev, error: null }))} className="shrink-0 hover:bg-red-200 rounded p-0.5 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {currentStep === AppStep.INPUT && (
              <div className="absolute inset-0 overflow-y-auto p-4 sm:p-6">
                {renderInputStep()}
              </div>
            )}

            {currentStep === AppStep.MATRIX && (
              <div className="absolute inset-0">
                {renderContentStep(
                  "Ma trận đề thi",
                  genState.matrix,
                  handleGenerateSpecs,
                  "Tiếp theo: Bảng đặc tả",
                  false,
                  (val) => setGenState(prev => ({ ...prev, matrix: val }))
                )}
              </div>
            )}

            {currentStep === AppStep.SPECS && (
              <div className="absolute inset-0">
                {renderContentStep(
                  "Bảng đặc tả",
                  genState.specs,
                  handleGenerateExam,
                  "Tiếp theo: Đề thi",
                  false,
                  (val) => setGenState(prev => ({ ...prev, specs: val }))
                )}
              </div>
            )}

            {currentStep === AppStep.EXAM && (
              <div className="absolute inset-0">
                {renderContentStep(
                  "Đề thi hoàn chỉnh",
                  genState.exam,
                  () => { },
                  "Hoàn tất",
                  true,
                  (val) => setGenState(prev => ({ ...prev, exam: val }))
                )}
              </div>
            )}
          </>
        )}

        {/* ===== MODE: TẠO ĐỀ TƯƠNG TỰ ===== */}
        {appMode === 'similar' && (
          <div className="absolute inset-0 overflow-y-auto p-4 sm:p-6">
            <SimilarExamPage
              checkAuth={checkAuthOrTrial}
              onGenerationStart={() => handleGenerationStart('Tạo đề tương tự')}
              onGenerationComplete={handleGenerationComplete}
            />
          </div>
        )}


        {/* ===== MODE: SINH 3 ĐỀ BIẾN THỂ ===== */}
        {appMode === 'variants' && (
          <div className="absolute inset-0 overflow-y-auto p-4 sm:p-6">
            <VariantsExamPage 
              key={variantsResetKey} 
              checkAuth={checkAuthOrTrial} 
              onGenerationStart={() => handleGenerationStart('Sinh 3 đề biến thể')}
              onGenerationComplete={handleGenerationComplete}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="shrink-0 text-center py-2.5 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-0.5">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          Sinh Đề Biến Thể VIP © 2026
        </p>
        <p className="text-[11px] text-slate-500">
          Bản quyền & Hỗ trợ kỹ thuật: <strong>Thầy giáo Đinh Văn Thành</strong> – Trường THCS Đồng Yên, tỉnh Tuyên Quang · ĐT/Zalo: <strong>0915.213717</strong>
        </p>
      </footer>
    </div>
  );
};

export default App;

