import { GoogleGenAI, Chat, Part, Content } from "@google/genai";
import { VariantFileData } from "../types";
import { getApiKey } from "./geminiService";

const VARIANTS_SYSTEM_INSTRUCTION = `
# ExamGen Pro - SINH ĐỀ THI BIẾN THỂ CHUẨN ĐỊNH DẠNG ĐỀ GỐC & NGHỊ ĐỊNH 30

## VAI TRÒ
Bạn là chuyên gia khảo thí và soạn đề thi giáo dục hàng đầu. Nhiệm vụ của bạn là phân tích đề thi gốc được tải lên và sinh ra các đề thi biến thể tương đương (khác số liệu/bối cảnh nhưng giữ nguyên cấu trúc, ma trận, mức độ nhận thức và định dạng thể thức).

---

## NGUYÊN TẮC BẮT BUỘC: CHUẨN ĐỊNH DẠNG ĐỀ GỐC & CHUẨN NGHỊ ĐỊNH 30

1. **TIÊU ĐỀ ĐẦU TRANG & KHUNG THÔNG TIN ĐỀ THI:**
   - Tái hiện lại chính xác bố cục thông tin đầu trang như đề gốc (Ví dụ: Tên Sở GD&ĐT / Tên Trường / Tổ chuyên môn, Đề kiểm tra học kỳ/giữa kỳ/15p/45p, Môn học, Khối lớp, Thời gian làm bài, v.v.).
   - Ghi rõ tiêu đề: **ĐỀ THI BIẾN THỂ SỐ [X]** (hoặc tiêu đề theo format đề gốc).

2. **GIỮ NGUYÊN 100% CẤU TRÚC ĐỀ GỐC:**
   - Giữ nguyên tất cả các phần như đề gốc (Ví dụ: PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN, PHẦN II. TRẮC NGHIỆM ĐÚNG/SAI, PHẦN III. TRẮC NGHIỆM TRẢ LỜI NGẮN, PHẦN IV. TỰ LUẬN...).
   - Giữ nguyên số lượng câu hỏi, thang điểm từng câu (nếu đề gốc có), thứ tự chủ đề và ma trận độ khó (Biết, Hiểu, Vận dụng, Vận dụng cao).
   - Chỉ thay đổi số liệu, dữ kiện, ngữ cảnh hoặc biến thể câu hỏi tương đương; không làm thay đổi bản chất và độ khó của đề thi.

3. **QUY CÁCH TRÌNH BÀY CÂU HỎI & ĐÁP ÁN TRẮC NGHIỆM:**
   - Ký hiệu câu hỏi: **Câu 1.**, **Câu 2.** (in đậm đầu câu).
   - Phương án trắc nghiệm: In đậm chữ cái phương án: **A.**, **B.**, **C.**, **D.**
   - Nếu các phương án ngắn (số, từ đơn, công thức ngắn): Xếp **A.**, **B.**, **C.**, **D.** trên cùng 1 dòng cách nhau khoảng cách hợp lý.
   - Nếu các phương án trung bình: Xếp 2 phương án/dòng (**A.**, **B.** trên dòng 1; **C.**, **D.** trên dòng 2).
   - Nếu các phương án dài: Mỗi phương án 1 dòng riêng.

4. **CÔNG THỨC TOÁN HỌC & KHOA HỌC:**
   - BẮT BUỘC dùng LaTeX chuẩn đặt trong cặp dấu $ (ví dụ: $x^2 + 2x + 1 = 0$, $\\sqrt{x}$, $\\frac{a}{b}$, $\\sin x$, $\\vec{a}$).
   - Không bao giờ viết công thức dưới dạng text thường để đảm bảo khi xuất Word hiển thị công thức chuẩn đẹp.

5. **QUY TẮC CÂU HỎI TRẢ LỜI NGẮN (NẾU CÓ):**
   - Đáp án câu TLN là một số cụ thể, độ dài không quá 4 ký tự. Nếu vượt quá phải có yêu cầu làm tròn trong đề.

6. **PHÂN TÁCH ĐỀ THI VÀ ĐÁP ÁN (NGẮT TRANG WORD):**
   - Đặt dấu ngắt trang \`***\` ngay giữa phần **ĐỀ THI** và phần **HƯỚNG DẪN CHẤM & ĐÁP ÁN**.
   - Cấu trúc xuất ra cho mỗi đề:
     + **PHẦN 1: ĐỀ THI** (Toàn bộ câu hỏi đề bài)
     + Dấu phân tách ngắt trang: \`***\`
     + **PHẦN 2: HƯỚNG DẪN CHẤM & ĐÁP ÁN CHI TIẾT**
       * Bảng đáp án trắc nghiệm nhanh (kẻ bảng Markdown gọn gàng: Câu | Đáp án)
       * Hướng dẫn giải chi tiết cho các câu tính toán, câu tự luận, câu vận dụng.
       * Đối với môn Tiếng Anh có phần nghe: Đính kèm nội dung bài nghe (Transcript / Audio Script) ở cuối phần đáp án.

7. **KHÔNG DÙNG ASCII ART VẼ KHUNG:** Dùng tiêu đề in hoa đậm và bảng Markdown chuẩn.
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
  onChunk: (text: string) => void
): Promise<void> => {
  const filePart: Part = {
    inlineData: {
      mimeType: file.type,
      data: file.data,
    },
  };

  const textPart: Part = {
    text: `BƯỚC 1:
Dựa vào file đề gốc được cung cấp, hãy phân tích toàn bộ cấu trúc và sinh ra **ĐỀ BIẾN THỂ SỐ 1** chuẩn 100% định dạng đề gốc và chuẩn thể thức Nghị định 30.
Sau đó đặt dấu phân cách \`***\` và viết **HƯỚNG DẪN CHẤM & ĐÁP ÁN CHI TIẾT CHO ĐỀ SỐ 1**.

Yêu cầu cụ thể:
- Giữ nguyên 100% cấu trúc, đề mục, thông tin đầu trang, số lượng câu, kiểu câu và độ khó như đề gốc.
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
  onChunk: (text: string) => void
): Promise<void> => {
  const prompt = `BƯỚC ${stepNumber}:
Tiếp tục sinh ra **ĐỀ BIẾN THỂ SỐ ${stepNumber}** (khác số liệu, ngữ cảnh so với đề gốc và các đề trước, giữ nguyên cấu trúc và độ khó).
Sau đó đặt dấu phân cách \`***\` và viết **HƯỚNG DẪN CHẤM & ĐÁP ÁN CHI TIẾT CHO ĐỀ SỐ ${stepNumber}**.

Yêu cầu cụ thể:
- Giữ nguyên 100% cấu trúc, đề mục, thông tin đầu trang, số lượng câu, kiểu câu và độ khó như đề gốc.
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

