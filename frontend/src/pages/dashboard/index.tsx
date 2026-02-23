import React, { useState, useEffect, useRef } from 'react';
import {
  UserOutlined,
  TeamOutlined,
  FileOutlined,
  SafetyOutlined,
  ToolOutlined,
  NotificationOutlined,
  SoundOutlined,
  FundProjectionScreenOutlined,
} from '@ant-design/icons';
import { Spin, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import echarts from '../../utils/echarts';
import { getDashboardStats } from '../../api/dashboard';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';

interface LogItem {
  id: number;
  username: string;
  operation: string;
  method: string;
  time: number;
  ip: string;
  status: number;
  createTime: string;
}

interface NoticeItem {
  id: number;
  title: string;
  type: number;
  createBy: string;
  createTime: string;
}

interface TrendItem {
  date: string;
  count: number;
}

interface DistItem {
  name: string;
  value: number;
}

interface StatsData {
  userCount: number;
  roleCount: number;
  menuCount: number;
  todayLogCount: number;
  recentLogs: LogItem[];
  recentNotices: NoticeItem[];
  weeklyTrend: TrendItem[];
  operationDistribution: DistItem[];
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  const { colorScheme } = useTheme();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? '上午好' : hour < 18 ? '下午好' : '晚上好';

  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const trendRef = useRef<HTMLDivElement>(null);
  const pieRef = useRef<HTMLDivElement>(null);
  const trendChartRef = useRef<echarts.ECharts | null>(null);
  const pieChartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then((res: unknown) => {
        const r = res as { data: StatsData };
        setStats(r.data);
      })
      .catch(() => { /* handled by interceptor */ })
      .finally(() => setLoading(false));
  }, []);

  // ECharts: 7-day trend
  useEffect(() => {
    if (!stats || !trendRef.current) return;
    const chart = echarts.init(trendRef.current);
    trendChartRef.current = chart;

    const trendData = stats.weeklyTrend || [];
    const dates = trendData.map((d) => {
      const date = String(d.date);
      return date.length >= 10 ? date.substring(5, 10) : date;
    });
    const counts = trendData.map((d) => d.count);

    chart.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(44,40,36,0.92)',
        borderColor: 'transparent',
        textStyle: { color: '#F5F0EB', fontSize: 12 },
        formatter: (params: any) => {
          const p = params[0];
          return `<div style="font-weight:500">${p.axisValue}</div><div style="margin-top:4px">${p.marker} 操作次数: <b>${p.value}</b></div>`;
        },
      },
      grid: { top: 20, right: 20, bottom: 30, left: 45 },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#E8E2DA' } },
        axisLabel: { color: '#7A756E', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: '#E8E2DA', type: 'dashed' } },
        axisLabel: { color: '#7A756E', fontSize: 11 },
      },
      series: [
        {
          data: counts,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: colorScheme.primary, width: 2.5 },
          itemStyle: { color: colorScheme.primary, borderColor: '#fff', borderWidth: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: colorScheme.primary + '40' },
              { offset: 1, color: colorScheme.primary + '05' },
            ]),
          },
        },
      ],
    });

    return () => { chart.dispose(); trendChartRef.current = null; };
  }, [stats, colorScheme]);

  // ECharts: operation distribution pie
  useEffect(() => {
    if (!stats || !pieRef.current) return;
    const chart = echarts.init(pieRef.current);
    pieChartRef.current = chart;

    const distData = stats.operationDistribution || [];
    const palette = [colorScheme.primary, '#D4A853', '#5B8C5A', '#4A90A4', '#8B6BAE', '#C75450', '#6B8E8E', '#A0774A'];

    chart.setOption({
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(44,40,36,0.92)',
        borderColor: 'transparent',
        textStyle: { color: '#F5F0EB', fontSize: 12 },
        formatter: (p: any) => `${p.marker} ${p.name}: <b>${p.value}</b> 次 (${p.percent}%)`,
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { color: '#7A756E', fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 8,
      },
      series: [
        {
          type: 'pie',
          radius: ['42%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 13, fontWeight: 500 },
            itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.15)' },
          },
          data: distData.map((d, i) => ({
            value: d.value,
            name: d.name,
            itemStyle: { color: palette[i % palette.length] },
          })),
        },
      ],
    });

    return () => { chart.dispose(); pieChartRef.current = null; };
  }, [stats, colorScheme]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      trendChartRef.current?.resize();
      pieChartRef.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 120 }}>
        <Spin size="large" />
      </div>
    );
  }

  const statCards = [
    { label: '用户总数', value: stats?.userCount ?? '-', icon: <UserOutlined />, cls: 'stat-icon-users', delay: '0s' },
    { label: '角色数量', value: stats?.roleCount ?? '-', icon: <TeamOutlined />, cls: 'stat-icon-roles', delay: '0.08s' },
    { label: '菜单数量', value: stats?.menuCount ?? '-', icon: <FileOutlined />, cls: 'stat-icon-menus', delay: '0.16s' },
    { label: '今日操作', value: stats?.todayLogCount ?? '-', icon: <SafetyOutlined />, cls: 'stat-icon-logs', delay: '0.24s' },
  ];

  const recentLogs = stats?.recentLogs ?? [];
  const recentNotices = stats?.recentNotices ?? [];

  return (
    <div className="dashboard">
      <div className="dashboard-greeting">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2>{greeting}，{userInfo?.nickname || '管理员'}</h2>
            <p>欢迎回到 Demo 管理系统，祝你工作顺利。</p>
          </div>
          <button
            onClick={() => navigate('/bigscreen')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, #0a192f, #0d2a45)',
              color: '#0af', border: '1px solid rgba(0,170,255,0.3)',
              padding: '8px 18px', borderRadius: 6, cursor: 'pointer',
              fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
            }}
          >
            <FundProjectionScreenOutlined />
            数据大屏
          </button>
        </div>
      </div>

      <div className="dashboard-stats">
        {statCards.map((item, i) => (
          <div className="stat-card" key={i} style={{ animationDelay: item.delay }}>
            <div className={`stat-card-icon ${item.cls}`}>{item.icon}</div>
            <div className="stat-card-label">{item.label}</div>
            <div className="stat-card-value">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="dashboard-row">
        <div className="dashboard-card" style={{ flex: 3 }}>
          <div className="dashboard-card-title">近7天操作趋势</div>
          <div ref={trendRef} style={{ width: '100%', height: 280 }} />
        </div>
        <div className="dashboard-card" style={{ flex: 2 }}>
          <div className="dashboard-card-title">操作类型分布</div>
          <div ref={pieRef} style={{ width: '100%', height: 280 }} />
        </div>
      </div>

      <div className="dashboard-row" style={{ marginTop: 16 }}>
        <div className="dashboard-card">
          <div className="dashboard-card-title">
            最近操作
            <a
              style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-primary)', cursor: 'pointer' }}
              onClick={() => navigate('/system/log')}
            >
              查看全部
            </a>
          </div>
          {recentLogs.length === 0 ? (
            <div style={{ color: '#999', fontSize: 13, padding: '16px 0' }}>暂无操作记录</div>
          ) : (
            recentLogs.map((log) => (
              <div className="dashboard-activity-item" key={log.id}>
                <div className="activity-dot" style={{
                  background: log.status === 0 ? 'var(--color-danger)' : undefined,
                }} />
                <div style={{ flex: 1 }}>
                  <div className="activity-text">
                    {log.username} {log.operation}
                    {log.status === 0 && <Tag color="error" style={{ marginLeft: 6, fontSize: 10 }}>失败</Tag>}
                  </div>
                  <div className="activity-time">{formatTime(log.createTime)}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-title">
            通知公告
            <a
              style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-primary)', cursor: 'pointer' }}
              onClick={() => navigate('/system/notice')}
            >
              查看全部
            </a>
          </div>
          {recentNotices.length === 0 ? (
            <div style={{ color: '#999', fontSize: 13, padding: '16px 0' }}>暂无通知公告</div>
          ) : (
            recentNotices.map((notice) => (
              <div className="dashboard-activity-item" key={notice.id}>
                <div className="activity-dot" style={{
                  background: notice.type === 1 ? '#1677ff' : 'var(--color-success)',
                  marginTop: 5,
                }} />
                <div style={{ flex: 1 }}>
                  <div className="activity-text" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {notice.type === 1 ? <NotificationOutlined style={{ fontSize: 12 }} /> : <SoundOutlined style={{ fontSize: 12 }} />}
                    {notice.title}
                    <Tag color={notice.type === 1 ? 'blue' : 'green'} style={{ marginLeft: 'auto', fontSize: 11 }}>
                      {notice.type === 1 ? '通知' : '公告'}
                    </Tag>
                  </div>
                  <div className="activity-time">{notice.createBy} · {formatTime(notice.createTime)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="dashboard-row" style={{ marginTop: 16 }}>
        <div className="dashboard-card">
          <div className="dashboard-card-title">快捷入口</div>
          <div className="shortcut-grid">
            {[
              { label: '用户管理', icon: <UserOutlined />, path: '/system/user' },
              { label: '角色管理', icon: <TeamOutlined />, path: '/system/role' },
              { label: '菜单管理', icon: <FileOutlined />, path: '/system/menu' },
              { label: '代码生成', icon: <ToolOutlined />, path: '/tool/gen' },
            ].map((item, i) => (
              <div className="shortcut-item" key={i} onClick={() => navigate(item.path)}>
                {item.icon}
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
