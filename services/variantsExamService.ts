import { GoogleGenAI, Chat, Part, Content } from "@google/genai";
import { VariantFileData } from "../types";
import { getApiKey } from "./geminiService";

const VARIANTS_SYSTEM_INSTRUCTION = `
# ExamGen Pro - SINH ĐỀ THI BIẾN THỂ TỰ ĐỘNG CHO MỌI MÔN HỌC & MỌI KỲ THI
# CHUẨN 100% THEO ĐỊNH DẠNG ĐỀ GỐC & CHUẨN THỂ THỨC NGHỊ ĐỊNH 30/2020/NĐ-CP

## VAI TRÒ
Bạn là chuyên gia khảo thí, đánh giá và thẩm định đề thi hàng đầu Việt Nam. Nhiệm vụ của bạn là phân tích sâu file đề gốc được tải lên (Toán, Ngữ Văn, Tiếng Anh, Vật Lý, Hóa Học, Sinh Học, Lịch Sử, Địa Lý, GDCD, Tin Học, Công Nghệ...; từ đề 15 phút, Giữa kỳ, Cuối kỳ đến đề HSG, Tuyển sinh 10, Tốt nghiệp THPT) và sinh ra các **ĐỀ THI BIẾN THỂ TƯƠNG ĐƯƠNG** chuẩn 100% theo định dạng của đề gốc đó.

---

## NGUYÊN TẮC BỐ CỤC: BÁM SÁT 100% ĐỀ GỐC & NGHỊ ĐỊNH 30

1. **TIÊU ĐỀ ĐẦU TRANG & KHUNG THÔNG TIN ĐỀ THI:**
   - Sử dụng Bảng Markdown 2 cột để trình bày khung thông tin đầu trang cân đối, chuyên nghiệp:
     | **UBND XÃ / PHÒNG GD&ĐT...**<br>**TRƯỜNG THCS / THPT...** | **BÀI KIỂM TRA ĐÁNH GIÁ CUỐI HỌC KỲ II**<br>**NĂM HỌC: 2025 - 2026**<br>**MÔN: TIẾNG ANH 6** (hoặc Môn học tương ứng)<br>*Thời gian làm bài: 90 phút (không kể thời gian giao đề)* |
     |:---:|:---:|

   - Dòng thông tin học sinh:
     **Họ và tên học sinh:** .................................................... **Lớp:** 6A...... **Mã đề: [Số mã đề]**

   - Nếu đề gốc có Bảng điểm: Kẻ bảng điểm chuẩn:
     | Điểm (Marks) | | Lời nhận xét của giáo viên |
     |:---:|:---:|:---|
     | **Nói (Speak)** | **Viết (Write)** | |
     | | | |

   - ⚠️ **LƯU Ý CỰC KỲ QUAN TRỌNG:** Sau Bảng điểm, **PHẦN CÂU HỎI ĐỀ BÀI (Part 1, Câu 1...) PHẢI BẮT ĐẦU NGAY TRÊN TRANG 1, LIỀN MẠCH, TUYỆT ĐỐI KHÔNG ĐƯỢC NGẮT TRANG HOẶC CHÈN DẤU *** LÀM NHẢY SANG TRANG 2.**

2. **GIỮ NGUYÊN 100% MA TRẬN & CẤU TRÚC ĐỀ GỐC:**
   - Đề gốc chia làm bao nhiêu phần, bao nhiêu câu, loại câu nào thì đề biến thể phải giữ nguyên y hệt:
     + Nếu đề gốc có các phần: PHẦN I, PHẦN II, PHẦN III... hoặc Part 1, Part 2, Part 3... ➔ Giữ nguyên tên và số lượng phần.
     + Trắc nghiệm nhiều lựa chọn, Trắc nghiệm Đúng/Sai, Trả lời ngắn, Tự luận, Đọc hiểu, Làm văn, Nghe - Nói - Đọc - Viết... ➔ Giữ nguyên thể loại câu hỏi và thang điểm từng câu.
     + Ma trận độ khó (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) phải tương đương hoàn toàn với đề gốc.

3. **QUY TẮC ĐẶC THÙ CHO TỪNG NHÓM MÔN HỌC:**
   - **Môn Toán, Lý, Hóa, Sinh, Tin:** Thay đổi số liệu, hàm số, đồ thị, phương trình tương đương; công thức bắt buộc dùng mã LaTeX bọc trong cặp dấu $ (ví dụ: $x^2 + 2x + 1 = 0$, $\\sqrt{x}$, $\\frac{a}{b}$).
   - **Môn Ngữ Văn:** Thay đổi ngữ liệu đọc hiểu mới cùng thể loại/chủ đề tương đương (thơ, truyện ngắn, văn bản nghị luận, văn bản thông tin); giữ nguyên dạng câu hỏi đọc hiểu và yêu cầu viết đoạn văn / bài văn nghị luận.
   - **Môn Tiếng Anh / Ngoại ngữ:** Thay đổi bài đọc, từ vựng, tình huống ngữ pháp tương đương. Tuyệt đối không dùng mã LaTeX $ hay \\text{} cho câu tiếng Anh; kèm theo Audio Script / Transcript bài nghe ở cuối đáp án nếu có phần Listening.
   - **Môn Lịch Sử, Địa Lý, GDCD, KTPL:** Đổi ngữ cảnh câu hỏi, bảng số liệu, biểu đồ, tình huống pháp luật/thực tế tương đương nhưng cùng đơn vị kiến thức.

4. **QUY CÁCH TRÌNH BÀY CÂU HỎI & PHƯƠNG ÁN:**
   - Đánh số câu theo đúng cách của đề gốc (**Câu 1.**, **Câu 2.** hoặc **1.**, **2.**).
   - In đậm chữ cái phương án: **A.**, **B.**, **C.**, **D.** (hoặc **a)**, **b)**, **c)**, **d)** với câu Đúng/Sai).
   - Mỗi phương án viết rõ ràng trên 1 dòng hoặc cách nhau khoảng trắng hợp lý.

5. **PHÂN TÁCH ĐỀ THI VÀ ĐÁP ÁN (NGẮT TRANG WORD):**
   - Đặt dấu ngắt trang *** ngay giữa phần **ĐỀ THI** và phần **HƯỚNG DẪN CHẤM & ĐÁP ÁN**.
   - Cấu trúc xuất ra cho mỗi đề:
     + **PHẦN 1: ĐỀ THI** (Toàn bộ nội dung đề bài theo đúng format đề gốc)
     + Dấu phân tách ngắt trang: ***
     + **PHẦN 2: HƯỚNG DẪN CHẤM & ĐÁP ÁN CHI TIẾT**
       * Bảng đáp án trắc nghiệm nhanh (kẻ bảng Markdown: Câu | Đáp án)
       * Hướng dẫn giải chi tiết cho từng câu / Biểu điểm chấm tự luận rõ ràng.

6. **ĐỊNH DẠNG XUẤT RA:**
   - Xuất văn bản Markdown thuần túy, sạch sẽ, chuẩn xác.
   - ⛔ KHÔNG bọc toàn bộ nội dung trong cặp dấu code block markdown.
   - ⛔ KHÔNG dùng các thẻ HTML rác như <div>, <span> trong nội dung.
`;

export const VARIANT_MODELS = [
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash" },
  { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview" },
  { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash-Lite" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash-Lite" },
];

export const createVariantSession = (apiKey: string, model: string = VARIANT_MODELS[0].id): Chat => {
  const ai = new GoogleGenAI({ apiKey });
  return ai.chats.create({
    model: model,
    config: {
      systemInstruction: VARIANTS_SYSTEM_INSTRUCTION,
      maxOutputTokens: 8192,
    },
  });
};

export const cloneVariantSession = async (apiKey: string, oldChat: Chat, newModel: string): Promise<Chat> => {
  let history: Content[] = [];
  try {
    history = await oldChat.getHistory();
  } catch (e) {
    console.warn("[Variants] Could not retrieve history for cloning, starting fresh", e);
  }

  const ai = new GoogleGenAI({ apiKey });
  return ai.chats.create({
    model: newModel,
    history: history,
    config: {
      systemInstruction: VARIANTS_SYSTEM_INSTRUCTION,
      maxOutputTokens: 8192,
    },
  });
};

// Bước 1: Sinh Đề 1 & Đáp án 1 (Có File gốc)
export const generateVariantStep1 = async (
  chat: Chat,
  file: VariantFileData,
  onChunk: (text: string) => void,
  formatOption: 'original' | 'decree30' = 'original'
): Promise<void> => {
  const filePart: Part = {
    inlineData: {
      mimeType: file.type,
      data: file.data,
    },
  };

  const formatInstruction = formatOption === 'decree30'
    ? "BẮT BUỘC: Chuẩn hóa thể thức hành chính đầu trang và bảng điểm chuẩn theo Nghị định 30/2020/NĐ-CP."
    : "BẮT BUỘC: Giữ nguyên 100% định dạng, khung tiêu đề đầu trang, cách đánh số câu và cấu trúc y hệt như file đề gốc tải lên.";

  const textPart: Part = {
    text: `BƯỚC 1:
Dựa vào file đề gốc được cung cấp, hãy phân tích toàn bộ cấu trúc và sinh ra **ĐỀ BIẾN THỂ SỐ 1** (${formatInstruction}).
Sau đó đặt dấu phân cách *** và viết **HƯỚNG DẪN CHẤM & ĐÁP ÁN CHI TIẾT CHO ĐỀ SỐ 1**.

Yêu cầu cụ thể:
- ${formatInstruction}
- Giữ nguyên số lượng câu, kiểu câu, ma trận độ khó nhận thức như đề gốc.
- Các phương án trắc nghiệm in đậm **A.**, **B.**, **C.**, **D.** (xếp gọn gàng trên 1 dòng nếu ngắn).
- Công thức toán/khoa học bắt buộc đặt trong cặp dấu $...$.
- Phần đáp án có Bảng đáp án trắc nghiệm và Lời giải chi tiết cho câu vận dụng/tự luận.
- Môn Tiếng Anh có nghe thì bổ sung Transcript ở cuối đáp án.`
  };

  try {
    const result = await chat.sendMessageStream({
      message: [filePart, textPart]
    });

    for await (const chunk of result) {
      if (chunk.text) onChunk(chunk.text);
    }
  } catch (error) {
    console.error("[Variants] Error Step 1:", error);
    throw error;
  }
};

// Bước 2 & 3: Sinh Đề tiếp theo
export const generateVariantNextStep = async (
  chat: Chat,
  stepNumber: number,
  onChunk: (text: string) => void,
  formatOption: 'original' | 'decree30' = 'original'
): Promise<void> => {
  const formatInstruction = formatOption === 'decree30'
    ? "Chuẩn hóa thể thức hành chính đầu trang theo Nghị định 30/2020/NĐ-CP."
    : "Giữ nguyên 100% định dạng, khung tiêu đề đầu trang, cách đánh số câu y hệt như đề gốc.";

  const prompt = `BƯỚC ${stepNumber}:
Tiếp tục sinh ra **ĐỀ BIẾN THỂ SỐ ${stepNumber}** (khác số liệu, ngữ cảnh so với đề gốc và các đề trước, ${formatInstruction}).
Sau đó đặt dấu phân cách *** và viết **HƯỚNG DẪN CHẤM & ĐÁP ÁN CHI TIẾT CHO ĐỀ SỐ ${stepNumber}**.

Yêu cầu cụ thể:
- ${formatInstruction}
- Giữ nguyên số lượng câu, kiểu câu, ma trận độ khó nhận thức như đề gốc.
- Các phương án trắc nghiệm in đậm **A.**, **B.**, **C.**, **D.** (xếp gọn gàng trên 1 dòng nếu ngắn).
- Công thức toán/khoa học bắt buộc đặt trong cặp dấu $...$.
- Phần đáp án có Bảng đáp án trắc nghiệm và Lời giải chi tiết cho câu vận dụng/tự luận.
- Môn Tiếng Anh có nghe thì bổ sung Transcript ở cuối đáp án.`;

  try {
    const result = await chat.sendMessageStream({
      message: prompt
    });

    for await (const chunk of result) {
      if (chunk.text) onChunk(chunk.text);
    }
  } catch (error) {
    console.error(`[Variants] Error Step ${stepNumber}:`, error);
    throw error;
  }
};



