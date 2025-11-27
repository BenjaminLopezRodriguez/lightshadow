"use client";

import { useState, useRef, useEffect } from "react";
import { X, Play, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBrowserProps {
  code: string;
  language?: string;
  onClose?: () => void;
}

export function CodeBrowser({ code, language = "javascript", onClose }: CodeBrowserProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isRunning, setIsRunning] = useState(false);

  const isExecutable = (lang: string) => {
    const executableLanguages = ["html", "css", "javascript", "js", "typescript", "ts"];
    return executableLanguages.includes(lang.toLowerCase());
  };

  useEffect(() => {
    if (isRunning && iframeRef.current && isExecutable(language)) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDoc) {
        // Create HTML document with the code
        let htmlContent = "";
        
        if (language.toLowerCase() === "html" || code.trim().startsWith("<")) {
          htmlContent = code;
        } else if (language.toLowerCase() === "css") {
          htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>${code}</style>
</head>
<body>
  <div class="container">
    <h1>CSS Preview</h1>
    <p>This is a preview of your CSS styles.</p>
  </div>
</body>
</html>`;
        } else if (language.toLowerCase() === "javascript" || language.toLowerCase() === "js" || language.toLowerCase() === "ts" || language.toLowerCase() === "typescript") {
          htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Preview</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #1a1a1a;
      color: #e0e0e0;
    }
    .console {
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 16px;
      margin-top: 20px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      max-height: 400px;
      overflow-y: auto;
    }
    .log {
      margin: 4px 0;
      padding: 4px 0;
      border-bottom: 1px solid #21262d;
    }
    .error { color: #f85149; }
    .warn { color: #d29922; }
    .info { color: #58a6ff; }
  </style>
</head>
<body>
  <h1>JavaScript Execution</h1>
  <div id="output"></div>
  <div class="console" id="console"></div>
  <script>
    // Override console methods to capture output
    const consoleDiv = document.getElementById('console');
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    
    function addLog(message, type = 'log') {
      const logDiv = document.createElement('div');
      logDiv.className = 'log ' + type;
      logDiv.textContent = message;
      consoleDiv.appendChild(logDiv);
      consoleDiv.scrollTop = consoleDiv.scrollHeight;
    }
    
    console.log = function(...args) {
      originalLog.apply(console, args);
      addLog(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '), 'log');
    };
    
    console.error = function(...args) {
      originalError.apply(console, args);
      addLog(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '), 'error');
    };
    
    console.warn = function(...args) {
      originalWarn.apply(console, args);
      addLog(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '), 'warn');
    };
    
    console.info = function(...args) {
      originalInfo.apply(console, args);
      addLog(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '), 'info');
    };
    
    // Execute the user's code
    try {
      ${code}
    } catch (error) {
      console.error('Error:', error.message);
      console.error(error.stack);
    }
  </script>
</body>
</html>`;
        } else {
          // Generic code display
          htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Code Preview</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: 'Courier New', monospace;
      background: #1a1a1a;
      color: #e0e0e0;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
<pre><code>${code}</code></pre>
</body>
</html>`;
        }
        
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();
      }
    }
  }, [code, language, isRunning]);

  const handleRun = () => {
    setIsRunning(true);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className={cn(
        "fixed bg-black/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl z-50 flex flex-col",
        isFullscreen
          ? "inset-4"
          : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-6xl h-[80vh]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-white/80">
            Code Browser - {language}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-white/10 bg-white/5">
        {isExecutable(language) ? (
          <>
            <button
              onClick={handleRun}
              disabled={isRunning}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                isRunning
                  ? "bg-green-500/20 text-green-400 cursor-not-allowed"
                  : "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
              )}
            >
              <Play className="w-4 h-4" />
              {isRunning ? "Running..." : "Run Code"}
            </button>
            {isRunning && (
              <button
                onClick={() => {
                  setIsRunning(false);
                  if (iframeRef.current) {
                    const iframeDoc = iframeRef.current.contentDocument;
                    if (iframeDoc) {
                      iframeDoc.open();
                      iframeDoc.write("");
                      iframeDoc.close();
                    }
                  }
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all"
              >
                Reset
              </button>
            )}
          </>
        ) : (
          <div className="px-4 py-2 rounded-lg text-sm text-white/60 bg-white/5">
            Code preview only - {language} is not executable
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-white/5">
        {isRunning ? (
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
            title="Code Preview"
          />
        ) : (
          <div className="p-6 h-full overflow-auto">
            <pre className="text-sm text-white/70 font-mono">
              <code>{code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
