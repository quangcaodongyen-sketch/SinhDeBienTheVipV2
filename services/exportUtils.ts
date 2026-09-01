import MarkdownIt from 'markdown-it';
// @ts-ignore
import { asBlob } from 'html-docx-js-typescript';

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true
});

/**
 * Hàm làm sạch và chuyển đổi thông minh các công thức / mã pseudo-LaTeX
 * sang định dạng văn bản và ký tự Unicode chuẩn đẹp cho Microsoft Word.
 */
export const cleanContentForWord = (content: string): string => {
  if (!content) return '';

  let text = content;

  // 0. Bóc bỏ triệt để các khối code block ```markdown ... ``` hoặc ``` ... ``` nếu Gemini bọc ngoài
  text = text.replace(/^```[a-zA-Z]*\r?\n?/gm, '').replace(/\r?\n?```$/gm, '');

  // 1. Loại bỏ các thẻ HTML rác có thể làm vỡ parser markdown-it
  text = text.replace(/<div[^>]*style="[^"]*page-break[^"]*"[^>]*><\/div>/gi, '\n\n***\n\n');
  text = text.replace(/<div[^>]*>/gi, '\n').replace(/<\/div>/gi, '\n');

  // 2. Loại bỏ \text{...}, \mathrm{...}, \mathbf{...} lặp lại
  for (let i = 0; i < 5; i++) {
    if (!text.includes('\\text{') && !text.includes('\\mathrm{') && !text.includes('\\mathbf{') && !text.includes('\\mathit{')) break;
    text = text.replace(/\\(?:text|mathrm|mathbf|mathit)\{([^{}]+)\}/g, '$1');
  }

  // 3. Chuyển đổi các cấu trúc ngữ pháp tiếng Anh hoặc văn bản bị bọc trong $...$
  text = text.replace(/\$([^\$\n]+)\$/g, (match, inner) => {
    const trimmed = inner.trim();
    const englishGrammarWords = /Subject|verb|object|present|past|future|simple|continuous|perfect|singular|plural|might|will|would|could|should|can|must|have|has|had|inf|V-inf|V-ing|V-ed|V_inf|V_ing|clause|condition|recycle|house|energy|sentence/i;
    if (englishGrammarWords.test(trimmed) || (!/[\\_^]/.test(trimmed) && /[a-zA-Z]{3,}/.test(trimmed))) {
      return trimmed;
    }
    return match;
  });

  // 4. Chuyển đổi các ký hiệu toán học phổ biến sang ký tự Unicode tương ứng
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

  // 5. Xử lý phân số đơn giản \frac{a}{b} -> (a)/(b)
  text = text.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');

  // 6. Xử lý căn bậc hai \sqrt{x} -> √(x)
  text = text.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');

  // 7. Xử lý vector \vec{a} -> a→
  text = text.replace(/\\vec\{([^{}]+)\}/g, '$1→');

  // 8. Gỡ bỏ dấu $ còn sót lại quanh các biểu thức chữ thường
  text = text.replace(/\$([A-Za-z0-9\s\+\-\=\(\)\,\.\/\:\;\?\!\'\"]{1,80})\$/g, (match, inner) => {
    if (!inner.includes('\\') && !inner.includes('^') && !inner.includes('_')) {
      return inner.trim();
    }
    return match;
  });

  return text;
};

/**
 * Xuất file Word (.docx) hỗ trợ 2 chế độ:
 * 1. 'original': Chuẩn theo đề gốc (Lề đều 20mm, giữ nguyên phong cách đề gốc)
 * 2. 'decree30': Chuẩn Nghị định 30/2020/NĐ-CP (Lề Trái 30mm đóng gáy, Trên/Dưới/Phải 20mm, A4, Times New Roman 13pt)
 */
export const exportToDoc = async (
  markdownOrHtmlContent: string, 
  fileName: string,
  formatOption: 'original' | 'decree30' = 'original'
) => {
  let rawText = markdownOrHtmlContent || '';

  // 1. Làm sạch trước nội dung
  rawText = cleanContentForWord(rawText);

  // 2. Chuyển đổi dấu ngắt trang CHỈ KHI là dấu *** phân tách giữa Đề và Đáp án (KHÔNG ngắt trang khi gặp dấu kẻ ngang ---)
  // Tránh việc ngắt trang ngay sau phần Header/Bảng điểm
  rawText = rawText.replace(/\n\s*\*{3,}\s*\n/g, (match, offset) => {
    // Không ngắt trang nếu dấu *** nằm quá gần đầu tài liệu (dưới 350 ký tự đầu là phần Header/Bảng điểm)
    if (offset < 350) return '\n\n';
    return '\n\n[[PAGE_BREAK_PLACEHOLDER]]\n\n';
  });

  // 3. Render Markdown sang HTML bằng markdown-it
  let htmlBody = md.render(rawText);

  // 4. Thay thế placeholder ngắt trang thành thẻ ngắt trang Word chuẩn
  htmlBody = htmlBody.replace(
    /\[\[PAGE_BREAK_PLACEHOLDER\]\]|<p>\[\[PAGE_BREAK_PLACEHOLDER\]\]<\/p>/g,
    '<br clear="all" style="page-break-before: always; mso-break-type: section-break;" />'
  );

  // 5. Tháo bỏ bất kỳ thẻ <pre><code> nào nếu markdown-it tạo ra (để tránh font Courier New)
  htmlBody = htmlBody.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '<div style="font-family: \'Times New Roman\', serif; font-size: 13pt;">$1</div>');
  htmlBody = htmlBody.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '<span style="font-family: \'Times New Roman\', serif; font-size: 13pt;">$1</span>');

  // 6. Tự động chuyển đổi bảng tiêu đề đầu trang thành bảng không viền (Borderless 2-Column Header)
  htmlBody = htmlBody.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (match, inner) => {
    if ((inner.includes('UBND') || inner.includes('TRƯỜNG') || inner.includes('PHÒNG GD') || inner.includes('SỞ GD')) && (inner.includes('BÀI KIỂM TRA') || inner.includes('ĐỀ KIỂM TRA') || inner.includes('ĐỀ THI') || inner.includes('HỌC KỲ') || inner.includes('HỌC KÌ'))) {
      const cleanedInner = inner
        .replace(/<td[^>]*>/gi, '<td style="border: none !important; padding: 2pt 4pt; vertical-align: top; text-align: center;">')
        .replace(/<th[^>]*>/gi, '<th style="border: none !important; padding: 2pt 4pt; vertical-align: top; text-align: center; background: transparent; font-weight: bold;">');
      return `<table style="border: none !important; border-collapse: collapse; width: 100%; margin-bottom: 6pt;">${cleanedInner}</table>`;
    }
    return match;
  });

  // 6. CSS chuẩn thể thức văn bản đề thi
  // Khổ giấy A4: Lề trái 2.5cm, Lề trên 2.0cm, Lề dưới 2.0cm, Lề phải 2.0cm
  // Phông chữ Times New Roman 13pt, Dãn dòng exactly 20pt, Dãn đoạn 4pt, Thụt đầu dòng 1.27cm, Căn đều 2 bên
  const leftMarginMm = '25mm';   // 2.5 cm
  const leftMarginTwip = 1417;   // 2.5 cm = 1417 twips

  const css = `
    <style>
      @page {
        size: 210mm 297mm;
        margin: 20mm 20mm 20mm ${leftMarginMm};
        mso-header-margin: 36pt;
        mso-footer-margin: 36pt;
        mso-paper-source: 0;
      }
      @page Section1 {
        size: 210mm 297mm;
        margin: 20mm 20mm 20mm ${leftMarginMm};
        mso-header-margin: 36pt;
        mso-footer-margin: 36pt;
        mso-paper-source: 0;
      }
      div.Section1 {
        page: Section1;
      }
      *, body, p, div, span, td, th, li, a, h1, h2, h3, h4, h5, h6 {
        font-family: 'Times New Roman', Times, serif !important;
        color: #000000 !important;
      }
      body { 
        font-size: 13pt; 
        line-height: 20pt; 
        mso-line-height-rule: exactly; 
        margin: 0;
        padding: 0;
        text-align: justify;
      }
      h1 { 
        font-size: 14pt; 
        font-weight: bold; 
        text-align: center; 
        text-transform: uppercase;
        margin: 10pt 0 4pt 0; 
        mso-margin-top-alt: 10pt;
        mso-margin-bottom-alt: 4pt;
        page-break-after: avoid;
        text-indent: 0 !important;
      }
      h2 { 
        font-size: 13pt; 
        font-weight: bold; 
        text-align: left;
        margin: 8pt 0 3pt 0; 
        mso-margin-top-alt: 8pt;
        mso-margin-bottom-alt: 3pt;
        page-break-after: avoid;
        text-indent: 0 !important;
      }
      h3 { 
        font-size: 13pt; 
        font-weight: bold; 
        text-align: left;
        margin: 6pt 0 2pt 0; 
        mso-margin-top-alt: 6pt;
        mso-margin-bottom-alt: 2pt;
        page-break-after: avoid;
        text-indent: 0 !important;
      }
      h4 { 
        font-size: 13pt; 
        font-weight: bold; 
        font-style: italic; 
        text-align: left;
        margin: 4pt 0 2pt 0; 
        mso-margin-top-alt: 4pt;
        mso-margin-bottom-alt: 2pt;
        page-break-after: avoid;
        text-indent: 0 !important;
      }
      p { 
        font-size: 13pt;
        line-height: 20pt;
        mso-line-height-rule: exactly;
        margin: 0 0 4pt 0; 
        mso-margin-top-alt: 0pt;
        mso-margin-bottom-alt: 4pt;
        text-align: justify; 
        text-indent: 1.27cm; /* Thụt đầu dòng 1 tab 1.27cm */
        page-break-inside: avoid;
      }
      /* Không thụt dòng đối với tiêu đề, bảng biểu, danh sách, phương án ABCD */
      h1, h2, h3, h4, h5, h6, th, td, li, .no-indent {
        text-indent: 0 !important;
      }
      table { 
        border-collapse: collapse; 
        width: 100%; 
        margin: 4pt 0 6pt 0; 
        page-break-inside: auto;
        text-indent: 0 !important;
      }
      tr { 
        page-break-inside: avoid; 
        page-break-after: auto; 
      }
      th, td { 
        border: 1px solid #000000; 
        padding: 3pt 5pt; 
        text-align: left; 
        vertical-align: middle;
        font-size: 12pt;
        line-height: 16pt;
        mso-line-height-rule: exactly;
        text-indent: 0 !important;
      }
      th { 
        background-color: #f2f2f2; 
        font-weight: bold; 
        text-align: center;
      }
      ol, ul { 
        margin: 2pt 0 4pt 18pt; 
        padding: 0;
        text-align: left;
        text-indent: 0 !important;
      }
      li { 
        margin-bottom: 2pt; 
        line-height: 20pt;
        mso-line-height-rule: exactly;
        font-size: 13pt;
        text-align: justify;
      }
      strong, b { 
        font-weight: bold; 
      }
      em, i { 
        font-style: italic; 
      }
    </style>
  `;

  const fullHtml = `<!DOCTYPE html>
<html lang="vi" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${fileName}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  ${css}
</head>
<body>
  <div class="Section1">
    ${htmlBody}
  </div>
</body>
</html>`;

  // Margin tính theo twips:
  // Top: 20mm = 1134, Right: 20mm = 1134, Bottom: 20mm = 1134, Left: 25mm = 1417
  const docxOptions = {
    orientation: 'portrait',
    margins: {
      top: 1134,    // 20mm (2.0 cm)
      right: 1134,  // 20mm (2.0 cm)
      bottom: 1134, // 20mm (2.0 cm)
      left: 1417    // 25mm (2.5 cm)
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
      const docBlob = new Blob(['\ufeff', fullHtml], { type: 'application/msword;charset=utf-8' });
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



