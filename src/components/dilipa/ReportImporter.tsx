'use client';

import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import clsx from 'clsx';
import { Upload, Download, FileJson, RotateCcw } from 'lucide-react';
import sampleReportJson from '@/data/sample-report.json';
import type { NormalizedReport } from '@/data/dilipa-report';
import { normalizeReport, normalizeReportText, MAX_REPORT_BYTES } from '@/lib/normalize-report';
import SourceBadge from '@/components/SourceBadge';
import DilipaWorkbench from '@/components/DilipaWorkbench';
import ReportCompareView from './ReportCompareView';

/**
 * Dilipa 报告导入器（T09）。
 *
 * 三个动作（断网可闭环，全程零网络请求）：
 *   ① 查看预置样例 —— 把 src/data/sample-report.json 归一化后渲染，标「演示样例」
 *   ② 导入我自己的 JSON —— <input type=file> + 拖拽 + FileReader.readAsText，标「真实输出」
 *   ③ 下载样例 JSON —— Blob + 临时 <a download>，不经过网络
 *
 * 归一化失败（非 JSON / 顶层非对象 / 超 1MB）只显示错误卡片，不抛异常、不写 localStorage。
 * 所有统计数字来自报告对象；报告渲染由 ReportCompareView / DilipaWorkbench 完成。
 */

const SAMPLE_TEXT: string = JSON.stringify(sampleReportJson, null, 2);

function demoReport(): NormalizedReport {
  return normalizeReport(sampleReportJson as unknown, 'demo');
}

export default function ReportImporter() {
  const [normalized, setNormalized] = useState<NormalizedReport | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [dragging, setDragging] = useState<boolean>(false);
  const [readError, setReadError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const loadText = useCallback((text: string, name: string) => {
    setReadError('');
    setFileName(name);
    setNormalized(normalizeReportText(text, 'real'));
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (file.size > MAX_REPORT_BYTES) {
        setReadError('文件超过 1MB，为避免卡住浏览器已拒绝导入。');
        setFileName(file.name);
        setNormalized(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        loadText(String(reader.result ?? ''), file.name);
      };
      reader.onerror = () => {
        setReadError(`读取文件 ${file.name} 失败，请重新选择或换一个 JSON 文件。`);
        setNormalized(null);
      };
      reader.readAsText(file);
    },
    [loadText]
  );

  const onInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
    event.target.value = '';
  };

  const onDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const downloadSample = (): void => {
    const blob = new Blob([SAMPLE_TEXT], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'dilipa-sample-report.json';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const showDemo = (): void => {
    setReadError('');
    setFileName('内置样例 sample-report.json');
    setNormalized(demoReport());
  };

  const reset = (): void => {
    setReadError('');
    setFileName('');
    setNormalized(null);
  };

  const ok = normalized?.ok ?? false;
  const state = normalized?.state ?? 'demo';

  return (
    <div className="space-y-5">
      {/* 动作条：三个按钮，无网络请求 */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <button type="button" onClick={showDemo} className="u-btn u-btn-primary !py-2 !px-3.5 !text-[12.5px]">
            <FileJson size={14} />
            查看预置样例
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="u-btn u-btn-ghost !py-2 !px-3.5 !text-[12.5px]"
          >
            <Upload size={14} />
            导入我自己的 JSON
          </button>
          <button type="button" onClick={downloadSample} className="u-btn u-btn-ghost !py-2 !px-3.5 !text-[12.5px]">
            <Download size={14} />
            下载样例 JSON
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            onChange={onInputChange}
            className="hidden"
            aria-label="选择 dilipa analyze JSON 报告"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SourceBadge state={normalized ? state : 'demo'} />
          <span className="u-lesson-note">
            {normalized ? '当前展示：' : '默认演示样例 · '}
            {fileName || '内置样例'}
          </span>
          {normalized && (
            <button type="button" onClick={reset} className="u-btn u-btn-ghost !py-1 !px-2 !text-[11px]">
              <RotateCcw size={11} />
              清空
            </button>
          )}
        </div>
      </div>

      {/* 拖拽区 */}
      <div
        className="u-report-drop"
        data-dragging={dragging}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
          也可以把一份 <code className="inline">dilipa analyze</code> 生成的 JSON 拖到这里。
        </p>
        <p className="u-lesson-note mt-1.5">
          浏览器本地读取，不上传、不联网、不写入本地存储；文件上限 1MB。
        </p>
      </div>

      {/* 读取失败 / 归一化失败：如实展示错误卡片 */}
      {readError && (
        <div className="u-error-card">
          <p className="font-mono text-[12px] mb-1.5 text-accent-red">导入未完成</p>
          <p className="text-[13px] leading-[1.85] text-[var(--text-muted)]">{readError}</p>
        </div>
      )}
      {!readError && normalized && !ok && (
        <div className="u-error-card">
          <p className="font-mono text-[12px] mb-1.5 text-accent-red">这份文件不能渲染成报告</p>
          <p className="text-[13px] leading-[1.85] text-[var(--text-muted)]">
            {normalized.error ?? '归一化失败，原因未记录。'}
          </p>
          {normalized.warnings.length > 0 && (
            <ul className="mt-2 space-y-1">
              {normalized.warnings.map((warning, i) => (
                <li key={i} className="text-[12px] text-[var(--text-muted)]">· {warning}</li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[12px] text-[var(--text-soft)]">
            可以先点「下载样例 JSON」，看看一份可渲染的报告长什么样，再把自己跑出的报告导进来。
          </p>
        </div>
      )}

      {/* 未选择时的引导 */}
      {!normalized && !readError && (
        <div className="u-panel p-6 text-center">
          <p className="text-[14px] text-[var(--text)] mb-2">还没载入报告</p>
          <p className="text-[13px] text-[var(--text-muted)] leading-relaxed max-w-xl mx-auto">
            点「查看预置样例」看一份课前备好的报告，或点「下载样例 JSON」保存到本地再自己导入一次 ——
            这条闭环不需要联网，也不需要现场跑命令行。
          </p>
        </div>
      )}

      {/* 报告对照视图：只有归一化成功才渲染 */}
      {ok && normalized && (
        <>
          <div className={clsx('u-panel p-5 md:p-6')}>
            <ReportCompareView normalized={normalized} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15px] font-semibold">三步预览工作台</h3>
            <SourceBadge state={state} />
            <span className="u-lesson-note">下面的列表与统计同样来自这份报告对象</span>
          </div>
          <DilipaWorkbench report={normalized.report} sourceState={state} />
        </>
      )}
    </div>
  );
}
