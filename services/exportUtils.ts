import MarkdownIt from 'markdown-it';

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

  // 0.1. Tự động loại bỏ triệt để mọi câu chào hỏi, lời dẫn của AI ở đầu đề thi
  text = text.replace(/^[\s\S]*?(?=\|[\s\S]*?(?:UBND|TRƯỜNG|PHÒNG GD|SỞ GD|BÀI KIỂM TRA|ĐỀ KIỂM TRA|ĐỀ THI|HỌC KỲ|HỌC KÌ))/i, '');
  text = text.replace(/^(?:Hệ thống đã phân tích|Dưới đây là|Chào bạn|Đây là đề|Sau đây là|Tôi đã học|Chúng tôi đã|Đề thi biến thể)[\s\S]*?\n\n/i, '');

  // 1. Loại bỏ các thẻ HTML rác và xử lý thông minh thẻ <br>
  text = text.replace(/<div[^>]*style="[^"]*page-break[^"]*"[^>]*><\/div>/gi, '\n\n***\n\n');
  text = text.replace(/<div[^>]*>/gi, '\n').replace(/<\/div>/gi, '\n');
  // Loại bỏ các thẻ <br> đứng lẻ loi trên một dòng riêng
  text = text.replace(/^\s*<br\s*\/?>\s*$/gmi, '');
  // Chuyển đổi <br> nằm giữa văn bản thông thường (ngoài bảng) thành 2 dấu cách + xuống dòng chuẩn Markdown
  text = text.replace(/([^\|\n])\s*<br\s*\/?>\s*([^\|\n])/gi, '$1  \n$2');

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
 * Xuất file Word (.doc / .docx) chuẩn tuyệt đối theo quy định của Bộ GD&ĐT:
 * - Khổ giấy: A4 (595.3pt x 841.9pt)
 * - Định lề trang: Trái 2.5cm (70.85pt), Phải 2.0cm (56.7pt), Trên 2.0cm (56.7pt), Dưới 2.0cm (56.7pt)
 * - Phông chữ: Times New Roman, Cỡ chữ 13pt (bảng biểu 12pt, tiêu đề chính 14pt)
 * - Dãn dòng: Exactly 20pt (mso-line-height-rule: exactly)
 * - Dãn đoạn: After 4pt, Before 0pt
 * - Thụt đầu dòng đoạn văn: 1.27cm (36pt)
 * - Căn lề: Căn đều 2 bên (Justify)
 * - Bảng biểu viền 1px, Bảng tiêu đề đầu trang không viền (Borderless)
 */
export const exportToDoc = async (
  markdownOrHtmlContent: string, 
  fileName: string,
  formatOption: 'original' | 'decree30' = 'original'
) => {
  let rawText = markdownOrHtmlContent || '';

  // 1. Làm sạch trước nội dung
  rawText = cleanContentForWord(rawText);

  // 2. Chuyển đổi dấu ngắt trang CHỈ KHI là dấu *** phân tách giữa Đề và Đáp án
  rawText = rawText.replace(/\n\s*\*{3,}\s*\n/g, (match, offset) => {
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

  // 5. Tháo bỏ thẻ <pre><code> nếu có
  htmlBody = htmlBody.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '<p class="MsoNormal" style="text-indent: 0cm;">$1</p>');
  htmlBody = htmlBody.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '<span>$1</span>');

  // 6. Tự động định dạng các đoạn văn (Paragraphs) thông minh:
  // - Đoạn văn nhiều dòng (trên 130 ký tự): Thụt đầu dòng 1.27cm (36pt), dòng sau sát lề, căn đều 2 bên (Justify).
  // - Câu hỏi ngắn & phương án: Căn lề trái tự nhiên (Left), không bị giãn chữ.
  htmlBody = htmlBody.replace(/<p>([\s\S]*?)<\/p>/gi, (match, inner) => {
    const plainText = inner.replace(/<[^>]+>/g, '').trim();
    if (plainText.length > 130 && !plainText.startsWith('A.') && !plainText.startsWith('B.') && !plainText.startsWith('C.') && !plainText.startsWith('D.')) {
      return `<p class="MsoNormal passage" style="text-align: justify; text-indent: 36.0pt; margin-bottom: 4.0pt;">${inner}</p>`;
    }
    return `<p class="MsoNormal" style="text-align: left; text-indent: 0cm; margin-bottom: 3.5pt;">${inner}</p>`;
  });

  // 7. Nhận diện và biến bảng đầu trang (Header Table) & bảng đáp án ABCD thành Bảng không viền (Borderless Table)
  htmlBody = htmlBody.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (match, inner) => {
    // Bảng đầu trang
    if ((inner.includes('UBND') || inner.includes('TRƯỜNG') || inner.includes('PHÒNG GD') || inner.includes('SỞ GD')) && (inner.includes('BÀI KIỂM TRA') || inner.includes('ĐỀ KIỂM TRA') || inner.includes('ĐỀ THI') || inner.includes('HỌC KỲ') || inner.includes('HỌC KÌ'))) {
      const cleanedInner = inner
        .replace(/<td[^>]*>/gi, '<td style="border: none !important; padding: 2pt 4pt; vertical-align: top; text-align: center; text-indent: 0cm;">')
        .replace(/<th[^>]*>/gi, '<th style="border: none !important; padding: 2pt 4pt; vertical-align: top; text-align: center; background: transparent; font-weight: bold; text-indent: 0cm;">');
      return `<table class="header-table" style="border: none !important; border-collapse: collapse; width: 100%; margin-bottom: 6pt; text-indent: 0cm;">${cleanedInner}</table>`;
    }
    // Bảng đáp án A, B, C, D (dóng cột thẳng hàng)
    if (inner.includes('A.') && inner.includes('B.') && (inner.includes('C.') || inner.includes('D.'))) {
      const cleanedOptions = inner
        .replace(/<td[^>]*>/gi, '<td style="border: none !important; padding: 2pt 6pt; vertical-align: top; text-align: left; text-indent: 0cm;">')
        .replace(/<th[^>]*>/gi, '<th style="border: none !important; padding: 2pt 6pt; vertical-align: top; text-align: left; background: transparent; text-indent: 0cm;">');
      return `<table class="options-table" style="border: none !important; border-collapse: collapse; width: 100%; margin: 2pt 0 4pt 0; text-indent: 0cm;">${cleanedOptions}</table>`;
    }
    return match;
  });

  const leftMarginPt = formatOption === 'decree30' ? '85.05pt' : '70.85pt'; // 3.0cm hoặc 2.5cm

  const wordDocumentHtml = `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml"
xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="Microsoft Word 15">
<meta name="Originator" content="Microsoft Word 15">
<!--[if gte mso 9]>
<xml>
 <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
  <w:ValidateAgainstSchemas/>
  <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
  <w:IgnoreMixedContent>false</w:IgnoreMixedContent>
  <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>
  <w:Compatibility>
   <w:BreakWrappedTables/>
   <w:SnapToGridInCell/>
   <w:WrapTextWithPunct/>
   <w:UseAsianBreakRules/>
   <w:DontGrowAutofit/>
  </w:Compatibility>
  <w:BrowserLevel>MicrosoftInternetExplorer4</w:BrowserLevel>
 </w:WordDocument>
</xml>
<![endif]-->
<style>
<!--
 /* Style Definitions */
 @page Section1
	{size:595.3pt 841.9pt; /* Chuẩn A4 */
	margin:56.7pt 56.7pt 56.7pt ${leftMarginPt}; /* Trên 2cm, Phải 2cm, Dưới 2cm, Trái 2.5cm */
	mso-header-margin:36.0pt;
	mso-footer-margin:36.0pt;
	mso-paper-source:0;}
div.Section1
	{page:Section1;}
body
	{font-family:"Times New Roman",serif;
	font-size:13.0pt;
	line-height:1.25;
	text-align:left;
	color:black;}
p.MsoNormal, p
	{mso-style-parent:"";
	margin-top:0cm;
	margin-bottom:3.5pt;
	text-align:left;
	line-height:1.25;
	font-size:13.0pt;
	font-family:"Times New Roman",serif;
	color:black;}
p.passage, p.essay
	{text-align:justify;
	text-indent:36.0pt; /* Thụt đầu dòng 1.27cm cho đoạn văn dài */
	margin-bottom:4.0pt;}
h1
	{margin-top:10.0pt;
	margin-bottom:4.0pt;
	text-align:center;
	line-height:20.0pt;
	mso-line-height-rule:exactly;
	page-break-after:avoid;
	font-size:14.0pt;
	font-family:"Times New Roman",serif;
	font-weight:bold;
	text-transform:uppercase;
	text-indent:0cm;}
h2
	{margin-top:8.0pt;
	margin-bottom:3.0pt;
	text-align:left;
	line-height:20.0pt;
	mso-line-height-rule:exactly;
	page-break-after:avoid;
	font-size:13.0pt;
	font-family:"Times New Roman",serif;
	font-weight:bold;
	text-indent:0cm;}
h3
	{margin-top:6.0pt;
	margin-bottom:2.0pt;
	text-align:left;
	line-height:20.0pt;
	mso-line-height-rule:exactly;
	page-break-after:avoid;
	font-size:13.0pt;
	font-family:"Times New Roman",serif;
	font-weight:bold;
	text-indent:0cm;}
h4
	{margin-top:4.0pt;
	margin-bottom:2.0pt;
	text-align:left;
	line-height:20.0pt;
	mso-line-height-rule:exactly;
	page-break-after:avoid;
	font-size:13.0pt;
	font-family:"Times New Roman",serif;
	font-weight:bold;
	font-style:italic;
	text-indent:0cm;}
table
	{border-collapse:collapse;
	mso-table-layout-alt:fixed;
	border:solid black 1.0pt;
	mso-border-alt:solid black .5pt;
	margin-top:4.0pt;
	margin-bottom:6.0pt;
	width:100%;
	text-indent:0cm;}
td, th
	{border:solid black 1.0pt;
	mso-border-alt:solid black .5pt;
	padding:3.0pt 5.0pt 3.0pt 5.0pt;
	text-align:left;
	vertical-align:middle;
	font-size:12.0pt;
	line-height:16.0pt;
	mso-line-height-rule:exactly;
	font-family:"Times New Roman",serif;
	text-indent:0cm;}
th
	{background:#F2F2F2;
	font-weight:bold;
	text-align:center;}
table.header-table, table.header-table td, table.header-table th
	{border:none !important;
	mso-border-alt:none !important;
	padding:2.0pt 4.0pt 2.0pt 4.0pt;
	text-align:center;
	background:transparent !important;
	text-indent:0cm;}
ol, ul
	{margin-top:0cm;
	margin-bottom:4.0pt;
	margin-left:18.0pt;
	padding:0;
	text-indent:0cm;}
li
	{margin-bottom:2.0pt;
	line-height:20.0pt;
	mso-line-height-rule:exactly;
	font-size:13.0pt;
	font-family:"Times New Roman",serif;
	text-align:justify;}
-->
</style>
</head>
<body lang="VI" style="tab-interval:36.0pt">
<div class="Section1">
${htmlBody}
</div>
</body>
</html>`;

  try {
    const blob = new Blob(['\ufeff', wordDocumentHtml], { 
      type: 'application/msword;charset=utf-8' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Word export failed:", err);
    alert("Không thể xuất file Word. Vui lòng thử lại.");
  }
};



