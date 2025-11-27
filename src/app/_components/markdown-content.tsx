"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Play } from "lucide-react";
import { CodeBrowser } from "./code-browser";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const [openBrowser, setOpenBrowser] = useState<{
    code: string;
    language: string;
  } | null>(null);

  const isExecutable = (lang: string) => {
    const executableLanguages = ["html", "css", "javascript", "js", "typescript", "ts"];
    return executableLanguages.includes(lang.toLowerCase());
  };

  return (
    <>
      <div className={cn("prose prose-invert max-w-none", className)}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            code({ node, inline, className: codeClassName, children, ...props }: any) {
              const match = /language-(\w+)/.exec(codeClassName || "");
              const language = match ? match[1] : "";
              const codeString = String(children).replace(/\n$/, "");
              const canExecute = isExecutable(language);

              return !inline && language ? (
                <div className="relative group my-4">
                  {canExecute && (
                    <div className="absolute top-2 right-2 z-10 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() =>
                          setOpenBrowser({
                            code: codeString,
                            language: language,
                          })
                        }
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/30 hover:bg-indigo-500/40 border border-indigo-500/40 rounded-lg text-sm text-indigo-200 hover:text-indigo-100 transition-all shadow-lg"
                        title="Run code"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        Run
                      </button>
                    </div>
                  )}
                  <pre className="bg-[#0d1117] border border-white/10 rounded-lg p-4 overflow-x-auto">
                    <code className={codeClassName} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              ) : (
                <code
                  className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            p({ children }) {
              return <p className="mb-4 leading-relaxed">{children}</p>;
            },
            h1({ children }) {
              return (
                <h1 className="text-2xl font-bold mb-4 mt-6 text-white">{children}</h1>
              );
            },
            h2({ children }) {
              return (
                <h2 className="text-xl font-bold mb-3 mt-5 text-white">{children}</h2>
              );
            },
            h3({ children }) {
              return (
                <h3 className="text-lg font-semibold mb-2 mt-4 text-white">{children}</h3>
              );
            },
            ul({ children }) {
              return <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>;
            },
            ol({ children }) {
              return <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>;
            },
            li({ children }) {
              return <li className="text-white/80">{children}</li>;
            },
            blockquote({ children }) {
              return (
                <blockquote className="border-l-4 border-indigo-500/50 pl-4 italic my-4 text-white/70">
                  {children}
                </blockquote>
              );
            },
            a({ href, children }) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 underline"
                >
                  {children}
                </a>
              );
            },
            table({ children }) {
              return (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full border border-white/10 rounded-lg">
                    {children}
                  </table>
                </div>
              );
            },
            th({ children }) {
              return (
                <th className="px-4 py-2 bg-white/5 border-b border-white/10 text-left font-semibold text-white">
                  {children}
                </th>
              );
            },
            td({ children }) {
              return (
                <td className="px-4 py-2 border-b border-white/5 text-white/80">
                  {children}
                </td>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {openBrowser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <CodeBrowser
            code={openBrowser.code}
            language={openBrowser.language}
            onClose={() => setOpenBrowser(null)}
          />
        </div>
      )}
    </>
  );
}
