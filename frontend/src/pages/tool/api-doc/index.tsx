import React, { useState } from 'react';
import { Spin, Button, Tooltip } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined, ReloadOutlined } from '@ant-design/icons';

const ApiDocPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const docUrl = '/api/doc.html';

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  return (
    <div
      style={{
        animation: 'fadeSlideUp 0.45s ease-out',
        ...(fullscreen ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          background: '#fff',
        } : {}),
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: fullscreen ? '8px 16px' : '0 0 12px 0',
        borderBottom: fullscreen ? '1px solid var(--color-border)' : 'none',
        background: fullscreen ? 'var(--color-surface)' : 'transparent',
      }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>
          接口文档
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Tooltip title="刷新">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => { setLoading(true); setIframeKey(k => k + 1); }}
            />
          </Tooltip>
          <Tooltip title={fullscreen ? '退出全屏' : '全屏'}>
            <Button
              size="small"
              icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
            />
          </Tooltip>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-surface, #fff)',
            zIndex: 1,
            minHeight: 300,
          }}>
            <Spin tip="加载接口文档..." />
          </div>
        )}
        <iframe
          key={iframeKey}
          src={docUrl}
          onLoad={() => setLoading(false)}
          style={{
            width: '100%',
            height: fullscreen ? 'calc(100vh - 49px)' : 'calc(100vh - 220px)',
            border: '1px solid var(--color-border, #e8e8e8)',
            borderRadius: fullscreen ? 0 : 8,
            background: '#fff',
          }}
          title="API Documentation"
        />
      </div>
    </div>
  );
};

export default ApiDocPage;
