import React, { useState, useEffect } from 'react';
import { Card, Progress, Table, Spin, Button, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined } from '@ant-design/icons';
import { getServerInfo } from '../../../api/server';

interface DiskItem {
  path: string;
  total: string;
  used: string;
  free: string;
  usageRate: string;
}

const parsePercent = (str: string): number => {
  return parseFloat(str.replace('%', '')) || 0;
};

const percentColor = (val: number): string => {
  if (val > 90) return '#C75450';
  if (val > 70) return '#D4A853';
  return '#5B8C5A';
};

const ServerPage: React.FC = () => {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await getServerInfo();
      setData(res.data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 120 }}>
        <Spin size="large" />
      </div>
    );
  }

  const { jvm, mem, sys, disk } = data;
  const jvmUsage = parsePercent(jvm?.usageRate || '0');
  const memUsage = parsePercent(mem?.usageRate || '0');

  const diskColumns: ColumnsType<DiskItem> = [
    { title: '盘符', dataIndex: 'path', key: 'path', width: 100 },
    { title: '总大小', dataIndex: 'total', key: 'total', width: 120 },
    { title: '已用', dataIndex: 'used', key: 'used', width: 120 },
    { title: '可用', dataIndex: 'free', key: 'free', width: 120 },
    {
      title: '使用率', dataIndex: 'usageRate', key: 'usageRate', width: 120,
      render: (val: string) => {
        const p = parsePercent(val);
        return <Tag color={p > 90 ? 'red' : p > 70 ? 'orange' : 'green'}>{val}</Tag>;
      },
    },
  ];

  return (
    <div style={{ animation: 'fadeSlideUp 0.45s ease-out' }}>
      <div className="page-toolbar" style={{ marginBottom: 16 }}>
        <span className="page-toolbar-title">服务监控</span>
        <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
      </div>

      {/* 使用率概览 */}
      <div className="server-overview">
        <Card className="server-card" title="JVM 内存" size="small">
          <div className="server-progress-wrap">
            <Progress
              type="dashboard"
              percent={jvmUsage}
              strokeColor={percentColor(jvmUsage)}
              size={120}
            />
          </div>
          <div className="server-desc">
            <span>已用 {jvm?.usedMemory}</span>
            <span>总计 {jvm?.totalMemory}</span>
          </div>
        </Card>

        <Card className="server-card" title="系统内存" size="small">
          <div className="server-progress-wrap">
            <Progress
              type="dashboard"
              percent={memUsage}
              strokeColor={percentColor(memUsage)}
              size={120}
            />
          </div>
          <div className="server-desc">
            <span>已用 {mem?.used}</span>
            <span>总计 {mem?.total}</span>
          </div>
        </Card>

        <Card className="server-card" title="CPU 信息" size="small">
          <div className="server-progress-wrap">
            <Progress
              type="dashboard"
              percent={parsePercent(sys?.cpuUsage || '0')}
              strokeColor={percentColor(parsePercent(sys?.cpuUsage || '0'))}
              size={120}
            />
          </div>
          <div className="server-desc">
            <span>核心数 {sys?.availableProcessors}</span>
            <span>使用率 {sys?.cpuUsage}</span>
          </div>
        </Card>
      </div>

      {/* 系统信息 */}
      <Card title="系统信息" size="small" style={{ marginBottom: 16 }}>
        <div className="server-info-grid">
          <div className="server-info-item"><label>操作系统</label><span>{sys?.osName} ({sys?.osArch})</span></div>
          <div className="server-info-item"><label>主机名称</label><span>{sys?.hostName}</span></div>
          <div className="server-info-item"><label>主机地址</label><span>{sys?.hostAddress}</span></div>
          <div className="server-info-item"><label>工作目录</label><span>{sys?.userDir}</span></div>
          <div className="server-info-item"><label>Java 版本</label><span>{jvm?.javaVersion}</span></div>
          <div className="server-info-item"><label>JVM 启动时间</label><span>{jvm?.startTime}</span></div>
          <div className="server-info-item"><label>运行时长</label><span>{jvm?.runTime}</span></div>
          <div className="server-info-item"><label>堆内存</label><span>{jvm?.heapUsed} / {jvm?.heapMax}</span></div>
        </div>
      </Card>

      {/* 磁盘信息 */}
      <Card title="磁盘信息" size="small">
        <Table
          columns={diskColumns}
          dataSource={disk || []}
          rowKey="path"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default ServerPage;
