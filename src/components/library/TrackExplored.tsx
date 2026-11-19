'use client';

/** 详情页埋点：点开即计入「已探索」（Q/R15 定义）。
 * 只写独立 key，不控制可达性；与主线的 useProgress 完全隔离。
 */
import { useEffect } from 'react';
import { useLibraryProgress } from '@/lib/useLibraryProgress';

export default function TrackExplored({ id }: { id: string }) {
  const { markExplored } = useLibraryProgress();
  useEffect(() => {
    markExplored(id);
  }, [id, markExplored]);
  return null;
}
