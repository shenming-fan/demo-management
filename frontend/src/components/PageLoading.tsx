import React from 'react';
import { Skeleton } from 'antd';

const PageLoading: React.FC = () => (
  <div style={{ padding: 24 }}>
    <Skeleton active paragraph={{ rows: 1, width: '30%' }} title={false} style={{ marginBottom: 24 }} />
    <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ flex: 1, background: 'var(--color-bg-container, #fff)', borderRadius: 10, padding: 20 }}>
          <Skeleton active paragraph={{ rows: 2 }} title={{ width: '60%' }} />
        </div>
      ))}
    </div>
    <div style={{ background: 'var(--color-bg-container, #fff)', borderRadius: 10, padding: 24 }}>
      <Skeleton active paragraph={{ rows: 8 }} title={{ width: '20%' }} />
    </div>
  </div>
);

export default PageLoading;
