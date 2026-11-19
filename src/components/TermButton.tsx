'use client';

import clsx from 'clsx';
import { type ReactNode } from 'react';
import { useGlossary } from './GlossaryProvider';
import { getGlossEntry } from '@/data/glossary';

/**
 * 正文术语触发按钮：统一「虚线下划线 + ⓘ」视觉。
 * 点击后由 GlossaryProvider 打开白话解释浮层，绝不触发使用条款抽屉。
 */
export interface TermButtonProps {
  /** glossary.ts 中的 GlossEntry.id */
  termId: string;
  children?: ReactNode;
  className?: string;
}

export default function TermButton({ termId, children, className }: TermButtonProps) {
  const { openTerm } = useGlossary();
  const entry = getGlossEntry(termId);
  const text: ReactNode = children ?? entry?.term ?? termId;

  return (
    <button
      type="button"
      className={clsx('u-term-trigger', className)}
      onClick={() => openTerm(termId)}
      aria-label={`术语解释：${entry?.term ?? termId}`}
      title={`点击看白话解释：${entry?.term ?? termId}`}
    >
      <span className="u-term-text">{text}</span>
      <span className="u-term-icon" aria-hidden="true">ⓘ</span>
    </button>
  );
}
