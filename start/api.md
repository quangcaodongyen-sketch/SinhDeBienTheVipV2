# 📋 QUY TẮC PHÁT TRIỂN & TỐI ƯU GEMINI API & AGENT PLATFORM API

> **Phiên bản:** 4.1 — cập nhật 09/08/2026  
> **Mục đích:** Tài liệu chuẩn cho app sinh giáo án chi tiết bằng Gemini API hoặc Agent Platform API, gồm chọn nhà cung cấp, chọn model, quy trình tạo nội dung, kiểm định chất lượng và fallback tự động.  
> **Nguồn kiểm tra:** tài liệu chính thức Google AI Models, Latest models, Deprecations, Pricing và Troubleshooting.

---

## I. MODEL HIỆN HÀNH VÀ CÁCH DÙNG

### Chuỗi model ổn định cho production

| Ưu tiên | Model | Trạng thái | Context | Output tối đa | Vai trò trong app |
|---|---|---|---:|---:|---|
| 1 | `gemini-3.6-flash` | Stable/GA (21/07/2026) | 1,048,576 | 65,536 | Mặc định; lập bản đồ nội dung và viết giáo án chi tiết |
| 2 | `gemini-3.5-flash` | Stable/GA | 1,048,576 | 65,536 | Dự phòng chất lượng cao |
| 3 | `gemini-3.5-flash-lite` | Stable/GA (21/07/2026) | 1,048,576 | 65,536 | Dự phòng nhanh, chi phí thấp, đọc/trích xuất tài liệu tốt |
| 4 | `gemini-3.1-flash-lite` | Stable; dự kiến ngừng sớm nhất 07/05/2027 | 1,048,576 | 65,536 | Tương thích ngược |
| 5 | `gemini-2.5-flash` | Stable | 1,048,576 | 65,536 | Dự phòng cuối chuỗi |

### Kết luận lựa chọn model

- Mặc định dùng `gemini-3.6-flash`: model mới hơn, output rẻ hơn 3.5 Flash và mạnh hơn ở tác vụ đa bước.
- Giữ `gemini-3.5-flash` ngay sau 3.6 để ưu tiên chất lượng giáo án khi model chính tạm lỗi.
- Thêm `gemini-3.5-flash-lite` thay cho Pro Preview trong chuỗi mặc định: đây là model GA, nhanh và phù hợp phân tích tài liệu.
- Không đặt `gemini-3.1-pro-preview` vào fallback production mặc định vì là Preview, có thể có giới hạn rate/billing khác và không có free tier API.
- Không dùng alias `gemini-flash-latest` trong production nếu cần hành vi ổn định; alias có thể được chuyển sang phiên bản mới.

### Model cũ/preview cần tránh trong app này

| Model | Lý do | Thay bằng |
|---|---|---|
| `gemini-3-pro-preview` | Đã shutdown 09/03/2026 | `gemini-3.1-pro-preview` khi thực sự cần Pro |
| `gemini-3.1-flash-lite-preview` | Đã shutdown 25/05/2026 | `gemini-3.5-flash-lite` |
| `gemini-2.0-flash`, `gemini-2.0-flash-lite` | Đã shutdown 01/06/2026 | `gemini-3.6-flash` hoặc `gemini-3.5-flash-lite` |
| `gemini-3-flash-preview` | Preview, đã có bản thay thế GA | `gemini-3.6-flash` |

### Giá paid tier tham khảo (01/08/2026)

| Model | Input / 1M token | Output / 1M token |
|---|---:|---:|
| `gemini-3.6-flash` | $1.50 | $7.50 |
| `gemini-3.5-flash` | $1.50 | $9.00 |
| `gemini-3.5-flash-lite` | $0.30 | $2.50 |

Giá có thể thay đổi; luôn kiểm tra trang Pricing trước release lớn.

### Danh mục các model Gemini mới nhất (Trả phí & Miễn phí)

Dưới đây là danh sách cập nhật các model khả dụng nếu dùng **Gemini API Key trả phí (Google AI Studio Paid)** hoặc được cấp quyền truy cập các phiên bản mới.

**1. Dòng Gemini 2.5 (Ổn định, hiệu suất cao)**
| Model | Model ID | Nên dùng khi |
|---|---|---|
| ⭐ Gemini 2.5 Pro | `gemini-2.5-pro` | Suy luận mạnh, viết code, xử lý tài liệu dài, giáo án, toán học |
| ⭐ Gemini 2.5 Flash | `gemini-2.5-flash` | Chat, tool AI, tốc độ nhanh, giá rẻ |
| ⭐ Gemini 2.5 Flash Lite | `gemini-2.5-flash-lite` | Chatbot số lượng lớn, automation, chi phí thấp |
| Gemini 2.5 Flash Live | `gemini-2.5-flash-live-preview` | Voice realtime |
| Gemini 2.5 Flash TTS | `gemini-2.5-flash-tts-preview` | Text to Speech |
| Gemini 2.5 Pro TTS | `gemini-2.5-pro-tts-preview` | Giọng đọc chất lượng cao |

**2. Dòng Gemini 3.x (Thế hệ mới, Agentic & Hiệu suất Token)**
Các model 3.x mang lại khả năng lập kế hoạch (agentic), viết code và hiệu quả token tốt hơn.
| Model | Model ID | 
|---|---|
| ⭐ Gemini 3.5 Flash | `gemini-3.5-flash` |
| ⭐ Gemini 3.5 Flash Lite | `gemini-3.5-flash-lite` |
| ⭐ Gemini 3.6 Flash | `gemini-3.6-flash` |
| Gemini 3.1 Pro | `gemini-3.1-pro-preview` |
| Gemini 3 Flash | `gemini-3-flash-preview` |
| Gemini 3.1 Flash Lite | `gemini-3.1-flash-lite` |

**3. Model Tạo Ảnh & Đa Phương Tiện**
| Loại | Model | Model ID |
|---|---|---|
| Tạo ảnh | ⭐ Nano Banana 2 | `nano-banana` |
| Tạo ảnh | Nano Banana 2 Lite | `nano-banana-lite` |
| Tạo ảnh | Nano Banana Pro | `nano-banana-pro` |
| Video | Veo 3.1 | `veo-3.1-generate-preview` |
| Video | Veo 3.1 Fast | `veo-3.1-fast-generate-preview` |
| Video | Veo 3.1 Lite | `veo-3.1-lite-generate-preview` |
| Âm thanh | Gemini 3.1 Flash Live | `gemini-3.1-flash-live-preview` |
| Âm thanh | Gemini 3.5 Live Translate| `gemini-3.5-live-translate-preview` |
| Âm thanh | Gemini 3.1 Flash TTS | `gemini-3.1-flash-tts-preview` |

### Gợi ý chọn Model cho các App Giáo Viên (giaovienai.vercel.app)

Để tối ưu hóa chi phí và hiệu suất khi xây dựng các ứng dụng giáo dục sau này, hãy tham khảo bảng phân bổ model sau:

| Chức năng / Ứng dụng | Model khuyên dùng | Lý do |
|---|---|---|
| Phân tích giáo án, Sinh đề kiểm tra | `gemini-2.5-pro` | Đòi hỏi suy luận logic, đọc hiểu văn bản dài, bám sát cấu trúc bài học. |
| Viết giáo án, Tạo phiếu học tập | `gemini-2.5-pro` | Yêu cầu chất lượng cao, format chuẩn xác và nội dung sư phạm tốt. |
| Prompt Engineer, Chuyển Word/PDF | `gemini-2.5-pro` | Khả năng trích xuất chính xác và tuân thủ system prompt tốt. |
| Chat AI thông thường, Hỏi đáp nhanh | `gemini-2.5-flash` | Tốc độ phản hồi tức thì, tiết kiệm chi phí cho các câu hỏi đơn giản. |
| Viết code HTML/JS, App Toán học/TikZ | `gemini-3.6-flash` hoặc `gemini-3.5-flash` | Mạnh mẽ trong logic lập trình, lập luận đa bước khi sinh mã. |
| Tạo ảnh minh họa bài học | `nano-banana` | Tạo và chỉnh sửa ảnh trực tiếp, phù hợp làm tài nguyên học liệu. |
| Tạo video bài giảng, minh họa | `veo-3.1-generate-preview` | Sinh video chất lượng cao từ text prompt. |

*Mẹo: Để kiểm tra chính xác API Key của bạn đang được phép sử dụng những model nào, hãy chạy đoạn code Python sau:*
```python
from google import genai
client = genai.Client(api_key="YOUR_API_KEY")
for model in client.models.list():
    print(model.name)
```

---

## II. CƠ CHẾ FALLBACK TỰ ĐỘNG

### Thứ tự thực tế

```txt
[Model người dùng chọn]
→ gemini-3.6-flash
→ gemini-3.5-flash
→ gemini-3.5-flash-lite
→ gemini-3.1-flash-lite
→ gemini-2.5-flash
```

Danh sách được loại trùng. Model người dùng chọn luôn được thử trước, kể cả khi không nằm trong chuỗi mặc định.

### Lỗi được phép chuyển model

- `500 INTERNAL`
- `503 UNAVAILABLE`
- `504 DEADLINE_EXCEEDED`
- text chứa `overloaded`, `high demand`, `try again later`, `temporarily unavailable`
- `404 NOT_FOUND` khi model/endpoint không còn khả dụng

### Lỗi phải dừng ngay, không chuyển model

- `401`, `API_KEY_INVALID`: key sai/hết hạn.
- `403`, `PERMISSION_DENIED`: key không có quyền.
- `429`, `RESOURCE_EXHAUSTED`: quota/rate limit; không được đánh dấu key là invalid.
- `400`, `INVALID_ARGUMENT`: payload hoặc tham số model sai.
- Lỗi không xác định: dừng để không phát sinh nhiều request ngoài ý muốn.

### Yêu cầu triển khai

- Mọi `generateContent` đều phải đi qua một hàm fallback duy nhất, gồm cả phân tích mẫu, trích lịch, gợi ý phương pháp, lập bản đồ nội dung, viết và sửa giáo án.
- Khi fallback, UI thông báo model nguồn, model đích và lý do; không làm mất kết quả bước trước.
- Không hiển thị lỗi 503 thành “API key không hợp lệ”.
- Không log full API key.

```ts
const FALLBACK_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
];

for (const model of getOrderedModels(selectedModel)) {
  try {
    return await callGemini(model, request);
  } catch (error) {
    const type = parseApiError(error);
    if (type !== 'MODEL_OVERLOADED' && type !== 'NOT_FOUND') throw error;
  }
}
```

---

## III. QUY TRÌNH THÊM AGENT PLATFORM API CHO APP MỚI

### Nguyên tắc bắt buộc

- Trong cửa sổ **Cài đặt API Key**, luôn có hai lựa chọn rõ ràng: **Gemini API** và **Agent Platform API**.
- Người dùng phải tự chọn dịch vụ. **Không tự động suy đoán nhà cung cấp từ tiền tố API key**.
- Key bắt đầu bằng `AQ...` có thể được người dùng dùng cho Gemini API hoặc Agent Platform API; định dạng key không quyết định endpoint.
- Lưu key riêng theo từng dịch vụ để chuyển đổi qua lại không làm ghi đè key:
  - Gemini API: `gemini_api_key`
  - Agent Platform API: `agent_platform_api_key`
- Lưu nhà cung cấp bằng `google_ai_provider` với giá trị `gemini` hoặc `agent-platform`.
- Chỉ coi lựa chọn là hợp lệ khi người dùng đã chọn thủ công; có thể lưu thêm `google_ai_provider_selection_source=manual`.
- Nếu app cũ từng lưu `vertex`, phải chuyển về Gemini mặc định và yêu cầu người dùng xác nhận lại, không tự động đổi thành Agent Platform API.

### Kiểu dữ liệu và client factory dùng chung

```ts
import { GoogleGenAI } from '@google/genai';

export type AiProvider = 'gemini' | 'agent-platform';

export const createGoogleAiClient = (
  apiKey: string,
  provider: AiProvider,
): GoogleGenAI => {
  if (provider === 'agent-platform') {
    // Cờ kỹ thuật của Google Gen AI SDK để định tuyến tới
    // aiplatform.googleapis.com trong chế độ API key.
    return new GoogleGenAI({ vertexai: true, apiKey });
  }

  return new GoogleGenAI({ apiKey });
};
```

`vertexai: true` chỉ là cờ định tuyến bắt buộc của Google Gen AI SDK cho Agent Platform API. Không dùng cờ này để suy đoán loại key và không hiển thị tên “Vertex AI Express” trên giao diện.

### Model Agent Platform API

Danh sách khởi đầu an toàn cho các app giáo dục:

```ts
export const AGENT_PLATFORM_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-3.1-pro-preview',
] as const;

export const AGENT_PLATFORM_FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
] as const;
```

- Model mặc định của Agent Platform API: `gemini-2.5-flash`.
- Khi chuyển từ Gemini API sang Agent Platform API, nếu model đang chọn không tương thích thì tự đưa về `gemini-2.5-flash`.
- Chỉ hiển thị model Agent Platform hỗ trợ trong giao diện của dịch vụ này.
- Danh sách model có thể thay đổi; phải kiểm tra tài liệu Agent Platform chính thức trước mỗi đợt release lớn.

### Bắt buộc định tuyến toàn bộ tác vụ qua client chung

Mọi lệnh gọi AI phải đi qua `createGoogleAiClient()` và hàm fallback chung, gồm:

- chat và sinh nội dung streaming;
- lập dàn ý, viết từng phần và tạo phụ lục;
- phân tích đề tài, tài liệu tham khảo và mẫu DOCX/PDF;
- thẩm định tài liệu cũ;
- gợi ý tên đề tài, phương pháp và hoạt động;
- các yêu cầu JSON có `responseMimeType: "application/json"`;
- biên tập hoặc rút gọn nội dung trong DOCX.

Không được tạo `new GoogleGenAI(...)` trực tiếp tại từng component hoặc từng tính năng. Chỉ client factory được phép khởi tạo SDK.

Với Agent Platform API, không bật `googleSearch` mặc định cho đến khi endpoint/model đã được xác nhận hỗ trợ. Các tác vụ văn bản, JSON và streaming vẫn chạy bình thường mà không cần công cụ này.

### Quy trình giao diện cài đặt

1. Hiển thị hai thẻ lựa chọn **Gemini API** và **Agent Platform API**.
2. Khi đổi thẻ, tải đúng key đã lưu của dịch vụ đó; không sao chép key giữa hai vùng lưu trữ.
3. Lọc lại danh sách model theo dịch vụ đang chọn.
4. Chấp nhận cả `AIzaSy...` và `AQ...` bằng một helper xác thực dùng chung.
5. Khi bấm **Lưu cấu hình**, lưu key, provider, dấu xác nhận thủ công và model đã được chuẩn hóa.
6. Khởi tạo lại phiên AI ngay sau khi lưu để mọi tác vụ tiếp theo dùng đúng endpoint.
7. Sau khi tải lại trang, phải giữ nguyên dịch vụ người dùng đã chọn.
8. Key từ `VITE_GEMINI_API_KEYS` chỉ dùng cho Gemini API. Nếu cần key Agent Platform mặc định, phải tạo biến môi trường riêng và đặt tên rõ ràng.

### Fallback và thông báo lỗi Agent Platform

- Có thể fallback model khi gặp `500`, `503`, `504`, `NOT_FOUND` hoặc model quá tải.
- Với Agent Platform API, có thể thử model tương thích tiếp theo khi gặp `403 PERMISSION_DENIED`, sau đó mới hiển thị lỗi quyền.
- Không báo `403` là “key sai”. Thông báo nên nêu rõ Google đã nhận key nhưng dự án/key chưa được cấp quyền gọi Agent Platform API hoặc model đó.
- Gợi ý người dùng kiểm tra: Agent Platform API đã bật, billing, API restrictions và quyền sử dụng model.
- Chỉ xoay vòng danh sách key Gemini khi provider là `gemini`. Agent Platform dùng vùng key riêng, không được lấy nhầm key từ bộ xoay Gemini.

### Kiểm thử bắt buộc trước khi bàn giao

- Chọn Gemini API, nhập key `AQ...`, lưu và tải lại: provider vẫn phải là Gemini.
- Chọn Agent Platform API, nhập key `AQ...`, lưu và tải lại: provider vẫn phải là Agent Platform.
- Key `AIzaSy...` và `AQ...` đều vượt qua kiểm tra định dạng.
- Không còn chữ “Vertex AI Express” trên giao diện.
- Không còn call site `new GoogleGenAI(...)` bên ngoài client factory.
- Chạy `npx tsc --noEmit` và `npm run build`.
- Mở app thật, kiểm tra console không có lỗi JavaScript.
- Nếu chưa có key thật, phải ghi rõ mới kiểm thử luồng giao diện và chưa xác nhận request live.

---

## IV. CẤU HÌNH API VÀ THINKING

- SDK: `@google/genai`.
- Gemini 3: dùng `thinkingConfig.thinkingLevel`; giáo án/planning dùng `HIGH`.
- Từ Gemini 3.6 Flash và 3.5 Flash-Lite, không gửi `temperature`, `topP`, `topK`; các tham số sampling này đã deprecated và có thể gây 400 trong model tương lai.
- Không dùng prefilled model turn ở cuối hội thoại.
- Trích JSON: dùng `responseMimeType: "application/json"`.
- Planning: `maxOutputTokens: 12288`.
- Giáo án hoàn chỉnh: `maxOutputTokens: 32768`.

---

## V. QUẢN LÝ API KEY

- Lưu Gemini API bằng `gemini_api_key`; lưu Agent Platform API bằng `agent_platform_api_key`.
- Lưu provider riêng bằng `google_ai_provider`; không suy đoán provider từ tiền tố key.
- Chỉ gửi key tới Google API; không đưa vào log, prompt hoặc file xuất.
- Chấp nhận cả key cũ `AIzaSy...` và auth key mới `AQ...`.
- Link Gemini API key: https://aistudio.google.com/apikey
- Link Agent Platform API key: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/start/api-keys

```ts
const GOOGLE_AI_API_KEY_PATTERN = /^(?:AIzaSy|AQ)\S{8,}$/;
```

| Trường hợp | Thông báo |
|---|---|
| Chưa nhập key | `Vui lòng cấu hình API Key trước khi sử dụng tính năng này.` |
| Key sai/hết hạn | `API Key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại trong Cài đặt.` |
| Không có quyền | `API key không có quyền truy cập Gemini API.` |
| Quota/rate limit | `Đã hết quota hoặc vượt giới hạn tốc độ API. Vui lòng đợi rồi thử lại.` |
| Model quá tải | `Model đang quá tải; app đang tự động thử model dự phòng.` |

---

## VI. CHECKLIST RELEASE

- [ ] Model mặc định là `gemini-3.6-flash`.
- [ ] Chuỗi fallback chỉ dùng model GA/stable mặc định.
- [ ] Tất cả call site Gemini đi qua fallback chung.
- [ ] 503 không bị báo thành lỗi API key.
- [ ] 429 không làm key bị đánh dấu invalid.
- [ ] Không còn `temperature`, `topP`, `topK` trong request Gemini 3.6/3.5 Lite.
- [ ] Có bước lập bản đồ nội dung trước khi viết giáo án.
- [ ] Có kiểm định độ dài, độ bám bài, nhiệm vụ, sản phẩm và tiêu chí riêng theo môn.
- [ ] Giáo án Toán có công thức LaTeX, ví dụ giải mẫu, bài tập và đáp án.
- [ ] DOCX hiển thị công thức dưới dạng Word Equation (OMML).
- [ ] Validator key chấp nhận `AIzaSy...` và `AQ...`.
- [ ] Có lựa chọn thủ công giữa Gemini API và Agent Platform API.
- [ ] Key Gemini và Agent Platform được lưu riêng, không ghi đè nhau.
- [ ] Key `AQ...` không làm app tự chuyển provider.
- [ ] Model Agent Platform được lọc riêng và mặc định về `gemini-2.5-flash` khi model cũ không tương thích.
- [ ] Mọi tác vụ streaming, non-streaming, JSON và DOCX đều đi qua client factory chung.
- [ ] Agent Platform không dùng nhầm bộ xoay key Gemini.
- [ ] Không còn chữ “Vertex AI Express” trên giao diện.
- [ ] Build `npm run lint` và `npm run build` thành công.

---

## VII. THAM KHẢO CHÍNH THỨC

- Latest models: https://ai.google.dev/gemini-api/docs/latest-model
- Models: https://ai.google.dev/gemini-api/docs/models
- Deprecations: https://ai.google.dev/gemini-api/docs/deprecations
- Pricing: https://ai.google.dev/gemini-api/docs/pricing
- Thinking: https://ai.google.dev/gemini-api/docs/generate-content/thinking
- Troubleshooting: https://ai.google.dev/gemini-api/docs/troubleshooting
- API key: https://ai.google.dev/gemini-api/docs/api-key
- Agent Platform Express mode overview: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/start/express-mode/overview
- Agent Platform API quickstart: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/start/express-mode/vertex-ai-express-mode-api-quickstart
- Agent Platform API key: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/start/api-keys
- Agent Platform REST API: https://docs.cloud.google.com/gemini-enterprise-agent-platform/reference/rest
