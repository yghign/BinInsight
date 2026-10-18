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

  return (
    <div className={clsx('code-block relative', className)}>
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-code-header)] rounded-t-[6px]">
          <span className="font-mono text-[11px] text-[var(--text-muted)]">{title}</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">
            {language}
          </span>
        </div>
      )}
      <pre className={showLineNumbers ? 'line-numbers' : ''}>
        <code ref={codeRef} className={langClass}>
          {code}
        </code>
      </pre>
    </div>
  );
}
