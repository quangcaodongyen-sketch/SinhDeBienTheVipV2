import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { cleanContentForWord } from '../services/exportUtils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  let processedContent = cleanContentForWord(content);
  // Loại bỏ hoàn toàn các thẻ <br> rác xuất hiện ngoài bảng để ReactMarkdown không in ra chữ <br>
  processedContent = processedContent.replace(/<br\s*\/?>/gi, '  \n');

  return (
    <div className={`exam-paper-preview bg-white text-black font-serif text-[14.5px] leading-relaxed select-text p-4 md:p-6 shadow-sm border border-slate-200 rounded-lg ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ className: codeClassName, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName || '');
            const isLatex = match && match[1] === 'latex';
            return isLatex ? (
              <div className="my-3 bg-slate-900 rounded-md overflow-hidden border border-slate-700">
                <div className="px-3 py-1 bg-slate-800 flex justify-between items-center text-xs text-slate-300">
                  <span>Mã LaTeX / TikZ</span>
                  <button onClick={() => navigator.clipboard.writeText(String(children))} className="text-blue-400 hover:underline">Copy</button>
                </div>
                <pre className="p-3 text-xs text-slate-200 font-mono overflow-x-auto">{children}</pre>
              </div>
            ) : (
              <span className="font-semibold text-black">{children}</span>
            );
          },
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-3">
              <table {...props} className="min-w-full border-collapse border border-black text-xs text-black">
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th {...props} className="border border-black bg-slate-50 px-2 py-1.5 font-bold text-center text-black">
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td {...props} className="border border-black px-2 py-1.5 text-left text-black">
              {children}
            </td>
          ),
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-center uppercase my-3 text-black">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold text-left my-2 text-black">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold text-left my-2 text-black">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-bold italic text-left my-1.5 text-black">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="mb-2 leading-relaxed text-black text-left">
              {children}
            </p>
          ),
          hr: () => (
            <div className="my-4 border-t-2 border-dashed border-slate-300 relative text-center">
              <span className="bg-white px-2 text-xs text-slate-400 font-sans uppercase tracking-wider relative -top-2.5">
                --- Hết Đề Thi / Sang Phần Đáp Án ---
              </span>
            </div>
          )
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
