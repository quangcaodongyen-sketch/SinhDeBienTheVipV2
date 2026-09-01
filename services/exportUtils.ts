import MarkdownIt from 'markdown-it';
// @ts-ignore
import { asBlob } from 'html-docx-js-typescript';

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true
});

/**
 * Hàm làm sạch và chuyển đổi thông minh các công thức / mã pseudo-LaTeX
 * sang định dạng văn bản và ký tự Unicode chuẩn đẹp cho Microsoft Word.
 * Xử lý triệt để các lỗi như:
 * - $\text{Subject} + \text{will} + ...$ -> Subject + will + ...
 * - $S + \text{might} + V\text{-inf}$ -> S + might + V-inf
 * - \text{...} -> ...
 * - Chuyển đổi các ký hiệu toán phổ biến (\times, \pm, \leq, \geq, \alpha, \pi, ...)
 */
export const cleanContentForWord = (content: string): string => {
  if (!content) return '';

  let text = content;

  // 1. Loại bỏ \text{...} lặp lại (hỗ trợ nested)
  for (let i = 0; i < 5; i++) {
    if (!text.includes('\\text{') && !text.includes('\\mathrm{') && !text.includes('\\mathbf{')) break;
    text = text.replace(/\\(?:text|mathrm|mathbf|mathit)\{([^{}]+)\}/g, '$1');
  }

  // 2. Chuyển đổi các cấu trúc ngữ pháp tiếng Anh hoặc văn bản bị bọc trong $...$
  // Ví dụ: $S + might + V-inf$, $If + S + V$, $\text{...}$
  text = text.replace(/\$([^\$\n]+)\$/g, (match, inner) => {
    const trimmed = inner.trim();
    // Nếu chứa các từ ngữ pháp tiếng Anh hoặc từ vựng thường, gỡ bỏ dấu $
    const englishGrammarWords = /Subject|verb|object|present|past|future|simple|continuous|perfect|singular|plural|might|will|would|could|should|can|must|have|has|had|inf|V-inf|V-ing|V-ed|V_inf|V_ing|clause|condition|recycle|house|energy/i;
    if (englishGrammarWords.test(trimmed) || (!/[\\_^]/.test(trimmed) && /[a-zA-Z]{3,}/.test(trimmed))) {
      return trimmed;
    }
    return match;
  });

  // 3. Chuyển đổi các ký hiệu toán học phổ biến sang ký tự Unicode tương ứng
  const symbolMap: [RegExp, string][] = [
    [/\\times\b/g, '×'],
    [/\\div\b/g, '÷'],
    [/\\pm\b/g, '±'],
    [/\\mp\b/g, '∓'],
    [/\\le(?:q)?\b/g, '≤'],
    [/\\ge(?:q)?\b/g, '≥'],
    [/\\ne(?:q)?\b/g, '≠'],
    [/\\approx\b/g, '≈'],
    [/\\equiv\b/g, '≡'],
    [/(?:\\degree|\\circ|\^\{\\circ\}|\^\\circ)/g, '°'],
    [/\\to\b|\\rightarrow\b/g, '→'],
    [/\\leftarrow\b/g, '←'],
    [/\\Rightarrow\b/g, '⇒'],
    [/\\Leftrightarrow\b/g, '⇔'],
    [/\\forall\b/g, '∀'],
    [/\\exists\b/g, '∃'],
    [/\\in\b/g, '∈'],
    [/\\notin\b/g, '∉'],
    [/\\subset\b/g, '⊂'],
    [/\\cup\b/g, '∪'],
    [/\\cap\b/g, '∩'],
    [/\\emptyset\b/g, '∅'],
    [/\\infty\b/g, '∞'],
    [/\\alpha\b/g, 'α'],
    [/\\beta\b/g, 'β'],
    [/\\gamma\b/g, 'γ'],
    [/\\Delta\b/g, 'Δ'],
    [/\\delta\b/g, 'δ'],
    [/\\pi\b/g, 'π'],
    [/\\theta\b/g, 'θ'],
    [/\\lambda\b/g, 'λ'],
    [/\\mu\b/g, 'μ'],
    [/\\sigma\b/g, 'σ'],
    [/\\omega\b/g, 'ω'],
    [/\\Omega\b/g, 'Ω'],
    [/\\cdot\b/g, '·'],
  ];

  for (const [pattern, replacement] of symbolMap) {
    text = text.replace(pattern, replacement);
  }

  // 4. Xử lý phân số đơn giản \frac{a}{b} -> a/b hoặc (a)/(b) nếu là công thức ngắn
  text = text.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');

  // 5. Xử lý căn bậc hai \sqrt{x} -> √(x)
  text = text.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');

  // 6. Xử lý vector \vec{a} -> a→ hoặc vec(a)
  text = text.replace(/\\vec\{([^{}]+)\}/g, '$1→');

  // 7. Gỡ bỏ dấu $ còn sót lại quanh các biểu thức đã được chuyển đổi sạch
  text = text.replace(/\$([A-Za-z0-9\s\+\-\=\(\)\,\.\/\:\;\?\!\'\"]{1,80})\$/g, (match, inner) => {
    // Nếu chỉ là chữ cái và phép tính cơ bản không có ký hiệu đặc thù LaTeX
    if (!inner.includes('\\') && !inner.includes('^') && !inner.includes('_')) {
      return inner.trim();
    }
    return match;
  });

  return text;
};

/**
 * Xuất file Word (.docx) chuẩn Nghị định 30/2020/NĐ-CP:
 * - Khổ giấy A4 (210mm x 297mm), định hướng đứng
 * - Định lề trang: Trên 20mm, Dưới 20mm, Trái 30mm (đóng gáy), Phải 20mm
 * - Phông chữ: Times New Roman, cỡ chữ 13pt (bảng biểu 12pt)
 * - Dãn dòng: 1.25 lines, dãn đoạn: 0pt / 4pt
 * - Căn lề: Căn trái (Left-aligned) cho tiêu đề/câu hỏi/đáp án để tránh giãn cách chữ quá mức
 * - Bảng biểu viền đen 1px, tiêu đề cột in đậm căn giữa
 * - Hỗ trợ ngắt trang (Page Break) giữa Đề và Đáp án / giữa các Đề biến thể
 */
export const exportToDoc = async (markdownOrHtmlContent: string, fileName: string) => {
  let htmlBody: string;

  if (markdownOrHtmlContent.trim().startsWith('<!DOCTYPE html>') || markdownOrHtmlContent.trim().startsWith('<html')) {
    // Làm sạch nội dung HTML
    const cleanedHtml = cleanContentForWord(markdownOrHtmlContent);
    htmlBody = cleanedHtml;
  } else {
    // 1. Làm sạch công thức / pseudo-LaTeX trong markdown
    const cleanedMarkdown = cleanContentForWord(markdownOrHtmlContent);

    // 2. Render markdown to HTML
    htmlBody = md.render(cleanedMarkdown);

    // 3. Chuyển đổi các thẻ <hr> (từ *** hoặc ---) thành Page Break chuẩn Word
    htmlBody = htmlBody.replace(
      /<hr\s*\/?>/gi,
      '<div style="page-break-before: always; mso-break-type: section-break; clear: both; height: 0; line-height: 0; font-size: 0;"></div>'
    );
  }

  // CSS chuẩn Nghị định 30/2020/NĐ-CP & Thể thức trình bày đề thi
  // Chú ý: Dùng text-align: left làm chủ đạo để tránh lỗi dãn khoảng cách chữ (stretched words) khi dùng justify
  const css = `
    <style>
      @page {
        size: A4 portrait;
        margin: 20mm 20mm 20mm 30mm; /* Trên 20mm, Phải 20mm, Dưới 20mm, Trái 30mm */
        mso-header-margin: 36pt;
        mso-footer-margin: 36pt;
        mso-paper-source: 0;
      }
      body { 
        font-family: 'Times New Roman', Times, serif; 
        font-size: 13pt; 
        line-height: 1.25; 
        color: #000000;
        margin: 0;
        padding: 0;
        text-align: left;
      }
      h1 { 
        font-family: 'Times New Roman', Times, serif;
        font-size: 14pt; 
        font-weight: bold; 
        text-align: center; 
        text-transform: uppercase;
        margin: 12pt 0 4pt 0; 
        page-break-after: avoid;
      }
      h2 { 
        font-family: 'Times New Roman', Times, serif;
        font-size: 13pt; 
        font-weight: bold; 
        text-align: left;
        margin: 10pt 0 3pt 0; 
        page-break-after: avoid;
      }
      h3 { 
        font-family: 'Times New Roman', Times, serif;
        font-size: 13pt; 
        font-weight: bold; 
        text-align: left;
        margin: 8pt 0 2pt 0; 
        page-break-after: avoid;
      }
      h4 { 
        font-family: 'Times New Roman', Times, serif;
        font-size: 13pt; 
        font-weight: bold; 
        font-style: italic; 
        text-align: left;
        margin: 6pt 0 2pt 0; 
        page-break-after: avoid;
      }
      p { 
        font-family: 'Times New Roman', Times, serif;
        font-size: 13pt;
        line-height: 1.25;
        margin: 0 0 4pt 0; 
        text-align: left; 
        page-break-inside: avoid;
      }
      table { 
        border-collapse: collapse; 
        width: 100%; 
        margin: 6pt 0 8pt 0; 
        page-break-inside: auto;
      }
      tr { 
        page-break-inside: avoid; 
        page-break-after: auto; 
      }
      th, td { 
        border: 1px solid #000000; 
        padding: 4pt 6pt; 
        text-align: left; 
        vertical-align: middle;
        font-family: 'Times New Roman', Times, serif;
        font-size: 12pt;
        line-height: 1.2;
      }
      th { 
        background-color: #f2f2f2; 
        font-weight: bold; 
        text-align: center;
      }
      .table-header-cell {
        font-weight: bold;
        text-align: center;
      }
      .table-center-cell {
        text-align: center;
      }
      table.header-table, table.borderless-table {
        border: none !important;
        margin-bottom: 8pt;
      }
      table.header-table td, table.borderless-table td {
        border: none !important;
        padding: 2pt 4pt;
        vertical-align: top;
      }
      ol, ul { 
        margin: 2pt 0 4pt 15pt; 
        padding: 0;
        text-align: left;
      }
      li { 
        margin-bottom: 2pt; 
        line-height: 1.25;
        font-size: 13pt;
        text-align: left;
      }
      strong, b { 
        font-weight: bold; 
      }
      em, i { 
        font-style: italic; 
      }
      .page-break {
        page-break-before: always;
        mso-break-type: section-break;
        clear: both;
        height: 0;
        line-height: 0;
        font-size: 0;
      }
      .question-title {
        font-weight: bold;
        text-align: left;
      }
      .options-group {
        margin: 2pt 0 4pt 0;
        page-break-inside: avoid;
        text-align: left;
      }
    </style>
  `;

  let fullHtml: string;
  if (htmlBody.includes('<!DOCTYPE html>') || htmlBody.includes('<html')) {
    fullHtml = htmlBody.replace(/<\/head>/i, `${css}</head>`);
  } else {
    fullHtml = `
      <!DOCTYPE html>
      <html lang="vi" xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8">
          <title>${fileName}</title>
          ${css}
        </head>
        <body>
          ${htmlBody}
        </body>
      </html>
    `;
  }

  // Margin Nghị định 30 tính theo twips (1mm = 56.7 twips):
  // Top: 20mm = 1134, Right: 20mm = 1134, Bottom: 20mm = 1134, Left: 30mm = 1701
  const docxOptions = {
    orientation: 'portrait',
    margins: {
      top: 1134,    // 20mm
      right: 1134,  // 20mm
      bottom: 1134, // 20mm
      left: 1701    // 30mm (chuẩn đóng gáy)
    }
  };

  try {
    const blob = await asBlob(fullHtml, docxOptions);
    const url = URL.createObjectURL(blob as Blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("DOCX generation failed, falling back to .doc:", error);
    try {
      const docBlob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
      const url = URL.createObjectURL(docBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (fallbackError) {
      console.error("Doc fallback also failed:", fallbackError);
      alert("Không thể tạo file Word. Vui lòng thử lại.");
    }
  }
};


