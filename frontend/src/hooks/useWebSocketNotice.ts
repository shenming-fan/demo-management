import { useEffect, useRef } from 'react';
import { notification } from 'antd';
import { NotificationOutlined, SoundOutlined } from '@ant-design/icons';
import React from 'react';

const MAX_RETRIES = 10;
const BASE_DELAY = 2000; // 2秒起步
const MAX_DELAY = 60000; // 最大60秒

/**
 * WebSocket通知Hook - 连接后端WebSocket，接收实时通知推送
 * 支持指数退避重连 + 最大重试次数
 */
export function useWebSocketNotice() {
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<number | null>(null);
  const retryRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    // 开发环境走后端8080端口
    const port = import.meta.env.DEV ? '8080' : window.location.port;
    const url = `${protocol}//${host}:${port}/api/ws/notice`;

    const connect = () => {
      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          retryRef.current = 0; // 连接成功，重置重试计数
          // 心跳保活 每30秒
          timerRef.current = window.setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send('ping');
            }
          }, 30000);
        };

        ws.onmessage = (event) => {
          if (event.data === 'pong') return;
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'notice' && msg.data) {
              const { title, type: noticeType, createBy } = msg.data;
              notification.info({
                message: noticeType === 1 ? '新通知' : '新公告',
                description: `${createBy} 发布了: ${title}`,
                icon: React.createElement(noticeType === 1 ? NotificationOutlined : SoundOutlined, {
                  style: { color: 'var(--color-primary)' },
                }),
                placement: 'topRight',
                duration: 6,
              });
              // 通知 NoticePopover 刷新未读数
              window.dispatchEvent(new CustomEvent('notice-refresh'));
            }
          } catch {
            // ignore parse errors
          }
        };

        ws.onclose = () => {
          if (timerRef.current) clearInterval(timerRef.current);
          // 指数退避重连
          if (retryRef.current < MAX_RETRIES) {
            const delay = Math.min(BASE_DELAY * Math.pow(2, retryRef.current), MAX_DELAY);
            retryRef.current += 1;
            reconnectTimerRef.current = window.setTimeout(connect, delay);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        if (retryRef.current < MAX_RETRIES) {
          const delay = Math.min(BASE_DELAY * Math.pow(2, retryRef.current), MAX_DELAY);
          retryRef.current += 1;
          reconnectTimerRef.current = window.setTimeout(connect, delay);
        }
      }
    };

    connect();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on unmount
        wsRef.current.close();
      }
    };
  }, []);
}
