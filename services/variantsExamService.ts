import { GoogleGenAI, Chat, Part, Content } from "@google/genai";
import { VariantFileData } from "../types";
import { getApiKey } from "./geminiService";

const VARIANTS_SYSTEM_INSTRUCTION = `
# ExamGen Pro - SINH ĐỀ THI BIẾN THỂ CHUẨN ĐỊNH DẠNG ĐỀ GỐC & NGHỊ ĐỊNH 30

## VAI TRÒ
Bạn là chuyên gia khảo thí và soạn đề thi giáo dục hàng đầu. Nhiệm vụ của bạn là phân tích đề thi gốc được tải lên và sinh ra các đề thi biến thể tương đương (khác số liệu/bối cảnh nhưng giữ nguyên cấu trúc, ma trận, mức độ nhận thức và định dạng thể thức).

---

## NGUYÊN TẮC BẮT BUỘC: CHUẨN ĐỊNH DẠNG ĐỀ GỐC & CHUẨN NGHỊ ĐỊNH 30

1. **TIÊU ĐỀ ĐẦU TRANG & KHUNG THÔNG TIN ĐỀ THI (GIỮ ĐÚNG BỐ CỤC ĐỀ GỐC):**
   - Trình bày thông tin đầu trang rõ ràng, xuống dòng đầy đủ (không dồn vào 1 dòng).
   - Ví dụ format chuẩn:
     **UBND XÃ / PHÒNG GD&ĐT...**  
     **TRƯỜNG THCS / THPT...**  

     **BÀI KIỂM TRA ĐÁNH GIÁ CUỐI HỌC KỲ II**  
     **NĂM HỌC: 2025 - 2026**  
     **MÔN: TIẾNG ANH 6** (hoặc Môn học tương ứng)  
     *Thời gian làm bài: 90 phút (không kể thời gian giao đề)*  

     **Họ và tên học sinh:** .................................................... **Lớp:** 6A...... **Mã đề: [Số mã đề]**

     (Nếu đề gốc có Bảng điểm / Lời phê thì kẻ bảng Markdown chuẩn:
     | Điểm | | Lời nhận xét của giáo viên |
     |:---:|:---:|:---|
     | **Nói (Speak)** | **Viết (Write)** | |
     | | | |
     )

2. **GIỮ NGUYÊN 100% CẤU TRÚC ĐỀ GỐC:**
   - Giữ nguyên các phần như đề gốc (Ví dụ: Part 1. Listening, Part 2. Language Focus, Part 3. Reading, Part 4. Writing...).
   - Giữ nguyên số lượng câu hỏi, số điểm từng phần, thang điểm từng câu và độ khó nhận thức.
   - Chỉ thay đổi ngữ liệu, từ vựng, bối cảnh bài tập cho tương đương đề gốc.

3. **QUY CÁCH TRÌNH BÀY CÂU HỎI & ĐÁP ÁN TRẮC NGHIỆM:**
   - Đánh số câu hỏi theo đề gốc: **Câu 1.**, **Câu 2.** (hoặc **1.**, **2.** nếu là đề Tiếng Anh).
   - Phương án trắc nghiệm: In đậm chữ cái phương án: **A.**, **B.**, **C.**, **D.**
   - Mỗi phương án viết rõ ràng trên 1 dòng hoặc cách nhau khoảng trắng hợp lý:
     **A.** Feed the cats  
     **B.** Clean the floors  
     **C.** Cook dinner  

4. **QUY TẮC CÔNG THỨC TOÁN HỌC & CẤU TRÚC NGỮ PHÁP TIẾNG ANH:**
   - **Đối với Toán, Lý, Hóa:** Bắt buộc dùng LaTeX chuẩn đặt trong cặp dấu $ (ví dụ: $x^2 + 2x = 0$, $\\sqrt{x}$).
   - **⛔ ĐỐI VỚI TIẾNG ANH, NGỮ VĂN VÀ CÁC MÔN XÃ HỘI:**
     + **TUYỆT ĐỐI KHÔNG** dùng ký hiệu $ hay lệnh \\text{} cho các cấu trúc ngữ pháp hay câu tiếng Anh!
     + **VIẾT HOÀN TOÀN BẰNG VĂN BẢN THƯỜNG (PLAIN TEXT):** Viết "S + might + V-inf", "Subject + will + verb + object", "If + S + V(present simple), S + will + V-inf".
     + **CẤM VIẾT:** $\\text{Subject} + \\text{will}...$ ❌ hay $S + \\text{might}...$ ❌.

5. **QUY TẮC PHÂN TÁCH ĐỀ VÀ ĐÁP ÁN (NGẮT TRANG WORD):**
   - Đặt dấu ngắt trang *** ngay giữa phần **ĐỀ THI** và phần **HƯỚNG DẪN CHẤM & ĐÁP ÁN**.
   - Cấu trúc xuất ra cho mỗi đề:
     + **PHẦN 1: ĐỀ THI** (Toàn bộ câu hỏi đề bài theo đúng format đề gốc)
     + Dấu phân tách ngắt trang: ***
     + **PHẦN 2: HƯỚNG DẪN CHẤM & ĐÁP ÁN CHI TIẾT**
       * Bảng đáp án trắc nghiệm nhanh (kẻ bảng Markdown: Câu | Đáp án)
       * Hướng dẫn giải chi tiết cho các câu (Trình bày gọn gàng: "**Câu 1.** **Đáp án A.** **Giải thích:** ...")
       * Đối với môn Tiếng Anh có phần nghe: Bổ sung Audio Script / Transcript bài nghe ở cuối phần đáp án.

6. **ĐỊNH DẠNG XUẤT RA:**
   - Xuất văn bản Markdown thuần túy, sạch sẽ.
   - ⛔ KHÔNG bọc toàn bộ nội dung trong cặp dấu code block (```markdown hoặc ```).
   - ⛔ KHÔNG dùng các thẻ HTML rác như <div>, <span> trong nội dung văn bản.
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
Sau đó đặt dấu phân cách *** và viết **HƯỚNG DẪN CHẤM & ĐÁP ÁN CHI TIẾT CHO ĐỀ SỐ 1**.

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
Sau đó đặt dấu phân cách *** và viết **HƯỚNG DẪN CHẤM & ĐÁP ÁN CHI TIẾT CHO ĐỀ SỐ ${stepNumber}**.

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
};


