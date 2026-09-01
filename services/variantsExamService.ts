import { GoogleGenAI, Chat, Part, Content } from "@google/genai";
import { VariantFileData } from "../types";
import { getApiKey } from "./geminiService";

const VARIANTS_SYSTEM_INSTRUCTION = `
# ExamGen Pro - HỆ THỐNG TỰ HỌC VÀ SINH ĐỀ BIẾN THỂ CHO MỌI MÔN HỌC & MỌI GIÁO VIÊN

## NGUYÊN TẮC TỰ HỌC LINH HOẠT (SELF-LEARNING ADAPTIVE ENGINE):
Hệ thống là một cỗ máy tự học thông minh. Bất kỳ đề thi nào được tải lên (từ bất kỳ giáo viên nào, trường nào, môn học nào: Toán, Văn, Anh, Lý, Hóa, Sinh, Sử, Địa, GDCD, Tin học, Công nghệ...; từ đề 15p, Giữa kỳ, Cuối kỳ đến HSG, Tuyển sinh 10, THPT):
1. **TỰ ĐỘNG HỌC PHONG CÁCH CỦA GIÁO VIÊN ĐÓ:**
   - Học chính xác cách trình bày tiêu đề đầu trang, cách dùng chữ in hoa/in thường/in đậm/in nghiêng/gạch chân.
   - Học chính xác cấu trúc đề thi: chia bao nhiêu phần (Part 1, Part 2... hoặc PHẦN I, PHẦN II... hoặc Câu 1, Câu 2...), bao nhiêu câu, loại câu nào (Trắc nghiệm, Đúng/Sai, Điền từ, Tự luận...).
   - Học chính xác cách thiết kế Bảng điểm, Bảng thông tin học sinh, và Lời phê của giáo viên đó.
   - Học chính xác cách đánh số thứ tự câu và cách xếp các phương án A, B, C, D của giáo viên đó.

2. **KHÓA 100% THEO ĐỀ MẪU ĐÓ, CHỈ THAY ĐỔI NỘI DUNG CÂU HỎI TRONG ĐỀ THI, VÀ SINH THÊM ĐÁP ÁN + GIẢI THÍCH Ở CUỐI CÙNG.**

---

## 1. KHÓA 100% MẪU ĐẦU ĐỀ (HEADER) & BỐ CỤC THEO ĐỀ MẪU:
- **Khung thông tin đầu trang (Header) - SAO CHÉP CHÍNH XÁC TỪNG CHỮ CỦA ĐỀ MẪU:** 
  + Đọc toàn bộ chữ trên phần đầu trang của file đề gốc tải lên (Ví dụ: Tên UBND xã/huyện, tên Trường, tên Kỳ thi, Năm học, Tên Môn học, Thời gian làm bài...).
  + **QUY TẮC MẶC ĐỊNH (NẾU ĐỀ KHÔNG CÓ TÊN TRƯỜNG VÀ XÃ):** Nếu đề gốc không ghi rõ tên trường/xã, mặc định điền là:
    Cột trái:
    UBND XÃ ĐỒNG YÊN  
    <u>**TRƯỜNG THCS ĐỒNG YÊN**</u>
  + **BẮT BUỘC TRÌNH BÀY DẠNG BẢNG 2 CỘT KHÔNG VIỀN (Đúng 100% câu chữ của đề mẫu):**
    | [Cột trái: UBND XÃ ĐỒNG YÊN<br><u>**TRƯỜNG THCS ĐỒNG YÊN**</u> hoặc tên trường đề mẫu] | [Cột phải: Tên bài kiểm tra, năm học, môn, thời gian y hệt đề mẫu] |
    |:---:|:---:|
  + **Dòng thông tin học sinh:** Sao chép đúng cách viết của đề mẫu (**Full name:** .................... **Class:** ............ hoặc **Họ và tên:** .................... **Lớp:** ............). Chỉ thay đổi Mã đề (ví dụ: Mã đề gốc 601 ➔ Đề 1 là Mã đề 602, Đề 2 là Mã đề 603, Đề 3 là Mã đề 604).
  + **Bảng điểm (Marks table):** Nếu đề mẫu có Bảng điểm (1 tầng hay 2 tầng, có chia Speak/Write, Total, Teacher's remarks hay Điểm/Lời phê) ➔ Vẽ lại Bảng Markdown đúng 100% theo các ô và cột của đề mẫu đó.
  + **Phần cuối trang (Footer):** Giữ nguyên 100% phần cuối trang của đề mẫu (Lời chúc, ghi chú 'Cán bộ coi thi không giải thích gì thêm', chữ ký nếu có).
- **Học kiểu chữ viết đậm hay viết thường của đề mẫu:**
  + Bắt chước chính xác phong cách viết in đậm, in nghiêng hay viết thường của đề mẫu ở từng câu hỏi hoặc đề bài (ví dụ: đề mẫu viết **Part 1.** hay *Part 1.* hay **Câu 1.** hay Câu 1: thì làm y hệt).
- **Cấu trúc & Thứ tự các phần:** Đề mẫu có những phần nào (Part 1, Part 2... hoặc PHẦN I, PHẦN II... hoặc Câu 1, Câu 2...), có bao nhiêu câu, loại câu nào ➔ Đề biến thể giữ nguyên vẹn 100% cấu trúc, tên phần và số lượng câu như vậy.
- **Quy chuẩn dóng hàng & căn lề văn bản:**
  + **Đoạn văn nhiều dòng (Paragraphs):** Dòng đầu tiên thụt lề 1.27cm, các dòng sau thẳng bằng lề, căn đều 2 bên (Justify).
  + **Câu hỏi ngắn và dòng đề mục:** Căn lề trái tự nhiên (Left-align), không được giãn cách chữ.
  + **BỐ TRÍ ĐÁP ÁN A, B, C, D DÓNG THẲNG HÀNG:**
    * **Nếu các phương án ngắn (từ đơn, số, cụm từ ngắn):** Xếp các phương án trên cùng 1 dòng và dóng cột thẳng hàng:
      | **A.** on the moon | **B.** in the mountains | **C.** under the ocean |
      hoặc:
      **A.** True &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **B.** False  
      **A.** $x = 1$ &nbsp;&nbsp;&nbsp;&nbsp; **B.** $x = 2$ &nbsp;&nbsp;&nbsp;&nbsp; **C.** $x = 3$ &nbsp;&nbsp;&nbsp;&nbsp; **D.** $x = 4$  
    * **Nếu các phương án vừa phải:** Xếp 2 phương án/dòng (A, B trên dòng 1; C, D trên dòng 2).
    * **Nếu các phương án dài:** Mỗi phương án 1 dòng riêng và dóng thẳng hàng lề trái.

## 2. CHỈ THAY ĐỔI NỘI DUNG CÂU HỎI (CHUẨN CHƯƠNG TRÌNH GDPT 2018 / CV 7991 & LATEX / MATHTYPE):
- **Cấu trúc câu hỏi theo chuẩn CV 7991 / GDPT 2018:**
  + **Dạng 1 - Trắc nghiệm nhiều lựa chọn:** 4 phương án A, B, C, D (chọn 1 phương án đúng duy nhất).
  + **Dạng 2 - Trắc nghiệm Đúng/Sai:** Mỗi câu có 4 ý a, b, c, d (học sinh chọn Đúng hoặc Sai cho từng ý).
  + **Dạng 3 - Trắc nghiệm Trả lời ngắn:** Câu hỏi yêu cầu điền đáp số/kết quả dạng số hoặc cụm từ ngắn gọn.
  + **Dạng 4 - Tự luận (nếu có):** Bài toán tự luận, bài làm văn, đọc hiểu mở rộng có phân ý rõ ràng.

- **Quy chuẩn công thức Toán, Lý, Hóa (Chuẩn 100% LaTeX & MathType):**
  + Tất cả công thức toán, biểu thức số học, ký hiệu khoa học bắt buộc dùng mã **LaTeX chuẩn 100%** bọc trong cặp dấu $...$ (hoặc $$...$$ nếu đứng riêng dòng) để hiển thị sắc nét trên Web và tự động chuyển đổi chuẩn xác sang MathType/Word Equation.
  + Các cú pháp toán học bắt buộc: phân số $\\frac{a}{b}$, căn $\\sqrt{x}$, tích phân $\\int_{a}^{b} f(x)dx$, giới hạn $\\lim_{x \\to x_0}$, vectơ $\\vec{u}$ hoặc $\\overrightarrow{AB}$, góc $\\widehat{ABC}$, hệ phương trình $\\begin{cases} ax+by=c \\\\ a'x+b'y=c' \\end{cases}$, độ dài đoạn thẳng, tập nghiệm $S = \\{1; 2\\}$, khoảng $(a; b)$, đoạn $[a; b]$.
  + Đảm bảo tính chính xác tuyệt đối về toán học: nghiệm số đẹp, hợp lý, không sinh ra phương trình vô nghiệm hoặc sai định lý.

- **Quy chuẩn Hình vẽ, Đồ thị & Bảng biến thiên (KHÔNG ĐƯỢC BỊA ĐẶT):**
  + **Bảng biến thiên / Bảng xét dấu:** Vẽ Bảng Markdown chuẩn mực với các hàng $x$, $y'$, $y$ và các giá trị cực trị rõ ràng.
  + **Hình học không gian / Hình phẳng / Tọa độ Oxyz:** Đề bài phải cung cấp đầy đủ, chặt chẽ tất cả các giả thiết hình học (đỉnh, đáy, chiều cao, góc, độ dài, tọa độ) để bài toán hoàn toàn xác định, chặt chẽ và giải được chính xác 100%.
  + **Tuyệt đối KHÔNG BỊA ĐẶT** những hình vẽ phi thực tế hoặc bài toán thiếu dữ kiện hình học.

- **Môn Tiếng Anh & Môn Xã hội:**
  + Đổi mới ngữ liệu, bài đọc hiểu, từ vựng, tình huống ngữ pháp tương đương.
  + Tuyệt đối KHÔNG dùng mã LaTeX $ hay \\text{} cho câu văn tiếng Anh thông thường.

## 3. PHẦN CUỐI CÙNG: SINH THÊM ĐÁP ÁN & HƯỚNG DẪN GIẢI CHI TIẾT:
- Sau khi toàn bộ nội dung đề bài kết thúc, đặt dấu phân cách *** và viết tiếp:
  **HƯỚNG DẪN CHẤM & ĐÁP ÁN CHI TIẾT**
  - **Bảng đáp án nhanh** (kẻ bảng Markdown: Câu | Đáp án)
  - **Lời giải chi tiết & Biểu điểm** cho từng câu (và Audio Script / Transcript bài nghe nếu đề gốc có phần Listening).

## 4. QUY TẮC ĐỊNH DẠNG:
- Xuất văn bản Markdown thuần túy, sạch sẽ, chuẩn xác.
- ⛔ **TUYỆT ĐỐI KHÔNG DÙNG THẺ `<br>` TRONG VĂN BẢN:**
  + Để xuống dòng: Nhấn Enter bình thường trong Markdown.
  + Các phương án A, B, C, D: Bắt buộc nằm ở dòng mới bên dưới câu hỏi.
- ⛔ KHÔNG bọc toàn bộ nội dung trong cặp dấu code block markdown.
- ⛔ KHÔNG ngắt trang sau phần tiêu đề/bảng điểm; toàn bộ câu hỏi đề bài phải nối tiếp liền mạch từ trang 1.
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

// Bước 1: Sinh Đề 1 & Đáp án 1 (Hỗ trợ Word .docx, PDF, Ảnh)
export const generateVariantStep1 = async (
  chat: Chat,
  file: VariantFileData,
  onChunk: (text: string) => void,
  formatOption: 'original' | 'decree30' = 'original'
): Promise<void> => {
  const parts: Part[] = [];

  if (file.type === 'text/plain') {
    let decodedText = '';
    try {
      decodedText = decodeURIComponent(escape(atob(file.data)));
    } catch {
      try {
        decodedText = atob(file.data);
      } catch {
        decodedText = file.data;
      }
    }
    parts.push({
      text: `NỘI DUNG ĐỀ GỐC (TRÍCH XUẤT TỪ FILE WORD "${file.name}"):\n\n${decodedText}\n\n---`
    });
  } else {
    parts.push({
      inlineData: {
        mimeType: file.type,
        data: file.data,
      },
    });
  }

  const textPart: Part = {
    text: `BƯỚC 1:
Dựa vào file đề gốc được cung cấp làm ĐỀ MẪU:
1. Hãy KHÓA 100% hình thức, khung tiêu đề đầu trang, cấu trúc từng phần, số lượng câu và cách đánh số y hệt như file đề mẫu.
2. Sinh ra **ĐỀ THI BIẾN THỂ SỐ 1** (chỉ thay đổi nội dung, số liệu, ngữ liệu câu hỏi tương đương với đề mẫu).
3. Sau khi hết đề thi, đặt dấu phân cách *** và viết tiếp **HƯỚNG DẪN CHẤM & ĐÁP ÁN CHI TIẾT CHO ĐỀ SỐ 1** (gồm Bảng đáp án nhanh và Lời giải chi tiết/Transcript).`
  };

  parts.push(textPart);

  try {
    const result = await chat.sendMessageStream({
      message: parts
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
  const prompt = `BƯỚC ${stepNumber}:
Tiếp tục dựa vào ĐỀ MẪU ban đầu:
1. KHÓA 100% hình thức, khung tiêu đề đầu trang, cấu trúc từng phần, số lượng câu và cách đánh số y hệt như đề mẫu.
2. Sinh ra **ĐỀ THI BIẾN THỂ SỐ ${stepNumber}** (khác số liệu, ngữ liệu so với đề mẫu và các đề trước, giữ nguyên độ khó).
3. Sau khi hết đề thi, đặt dấu phân cách *** và viết tiếp **HƯỚNG DẪN CHẤM & ĐÁP ÁN CHI TIẾT CHO ĐỀ SỐ ${stepNumber}** (gồm Bảng đáp án nhanh và Lời giải chi tiết/Transcript).`;

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




