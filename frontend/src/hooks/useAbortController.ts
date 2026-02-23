import { useEffect, useRef } from 'react';

/**
 * 返回一个 AbortController signal，组件卸载时自动取消未完成请求。
 * 每次调用 getSignal() 获取新的 signal 用于 axios 请求。
 *
 * 用法:
 *   const { getSignal } = useAbortController();
 *   const res = await request.get('/api/xxx', { signal: getSignal() });
 */
export function useAbortController() {
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      // 组件卸载时取消所有未完成请求
      controllerRef.current?.abort();
    };
  }, []);

  const getSignal = () => {
    // 每次获取新signal前，取消上一次
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    return controllerRef.current.signal;
  };

  return { getSignal };
}
