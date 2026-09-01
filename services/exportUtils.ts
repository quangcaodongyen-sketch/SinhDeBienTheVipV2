import MarkdownIt from 'markdown-it';
// @ts-ignore
import { asBlob } from 'html-docx-js-typescript';

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true
});

/**
 * Xuất file Word (.docx) chuẩn Nghị định 30/2020/NĐ-CP:
 * - Khổ giấy A4 (210mm x 297mm), định hướng đứng
 * - Định lề trang: Trên 20mm, Dưới 20mm, Trái 30mm (đóng gáy), Phải 20mm
 * - Phông chữ: Times New Roman, cỡ chữ 13pt (bảng biểu 12pt)
 * - Dãn dòng: 1.25 lines, dãn đoạn: 0pt / 4pt
 * - Căn lề: Căn đều 2 bên (Justify)
 * - Bảng biểu viền đen 1px, tiêu đề cột in đậm căn giữa
 * - Hỗ trợ ngắt trang (Page Break) giữa Đề và Đáp án / giữa các Đề biến thể
 */
export const exportToDoc = async (markdownOrHtmlContent: string, fileName: string) => {
  let htmlBody: string;

  if (markdownOrHtmlContent.trim().startsWith('<!DOCTYPE html>') || markdownOrHtmlContent.trim().startsWith('<html')) {
    // Nội dung đã là HTML hoàn chỉnh
    htmlBody = markdownOrHtmlContent;
  } else {
    // Render markdown to HTML
    htmlBody = md.render(markdownOrHtmlContent);

    // Chuyển đổi các thẻ <hr> (từ *** hoặc ---) thành Page Break chuẩn Word
    htmlBody = htmlBody.replace(
      /<hr\s*\/?>/gi,
      '<div style="page-break-before: always; mso-break-type: section-break; clear: both; height: 0; line-height: 0; font-size: 0;"></div>'
    );
  }

  // CSS chuẩn Nghị định 30/2020/NĐ-CP & Thể thức trình bày đề thi
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
        text-align: justify;
      }
      h1 { 
        font-family: 'Times New Roman', Times, serif;
        font-size: 14pt; 
        font-weight: bold; 
        text-align: center; 
        text-transform: uppercase;
        margin: 10pt 0 4pt 0; 
        page-break-after: avoid;
      }
      h2 { 
        font-family: 'Times New Roman', Times, serif;
        font-size: 13pt; 
        font-weight: bold; 
        text-align: left;
        margin: 8pt 0 3pt 0; 
        page-break-after: avoid;
      }
      h3 { 
        font-family: 'Times New Roman', Times, serif;
        font-size: 13pt; 
        font-weight: bold; 
        margin: 6pt 0 2pt 0; 
        page-break-after: avoid;
      }
      h4 { 
        font-family: 'Times New Roman', Times, serif;
        font-size: 13pt; 
        font-weight: bold; 
        font-style: italic; 
        margin: 4pt 0 2pt 0; 
        page-break-after: avoid;
      }
      p { 
        font-family: 'Times New Roman', Times, serif;
        font-size: 13pt;
        line-height: 1.25;
        margin: 0 0 4pt 0; 
        text-align: justify; 
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
        margin: 2pt 0 6pt 18pt; 
        padding: 0;
      }
      li { 
        margin-bottom: 2pt; 
        line-height: 1.25;
        font-size: 13pt;
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
      }
      .options-group {
        margin: 2pt 0 4pt 0;
        page-break-inside: avoid;
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

