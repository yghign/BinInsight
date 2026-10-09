'use client';

import { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-asm6502';
import clsx from 'clsx';

interface CodeBlockProps {
  code: string;
  language?: 'c' | 'cpp' | 'python' | 'javascript' | 'bash' | 'asm' | 'plaintext';
  showLineNumbers?: boolean;
  highlightLines?: number[];
  title?: string;
  className?: string;
}

export default function CodeBlock({
  code,
  language = 'c',
  showLineNumbers = true,
  highlightLines = [],
  title,
  className,
}: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  const langMap: Record<string, string> = {
    c: 'c',
    cpp: 'cpp',
    python: 'python',
    javascript: 'javascript',
    bash: 'bash',
    asm: 'asm6502',
    plaintext: 'plaintext',
  };

  const langClass = `language-${langMap[language] || language}`;

  // Build line-based content for highlighting
  const lines = code.split('\n');
  const highlightedCode = lines
    .map((line, i) => {
      const lineNum = i + 1;
      if (highlightLines.includes(lineNum)) {
        return `/*HL*/${line}`;
      }
      return line;
    })
    .join('\n');

  return (
    <div className={clsx('code-block relative', className)}>
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-code-header)] rounded-t-lg">
          <span className="text-xs text-[var(--text-muted)] font-medium">{title}</span>
          <span className="text-xs text-[var(--text-soft)] uppercase tracking-wide">{language}</span>
        </div>
      )}
      <pre className={showLineNumbers ? 'line-numbers' : ''}>
        <code ref={codeRef} className={langClass}>
          {code}
        </code>
      </pre>
      <style jsx>{`
        :global(.code-block) {
          background: var(--bg-code);
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow-x: auto;
        }
        :global(.code-block pre) {
          margin: 0;
          padding: 16px !important;
          background: transparent !important;
        }
        :global(.code-block code) {
          background: transparent !important;
          font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
          font-size: 13px;
          line-height: 1.65;
        }
      `}</style>
    </div>
  );
}
