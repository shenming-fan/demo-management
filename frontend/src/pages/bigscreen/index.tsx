import React, { useEffect, useRef, useState } from 'react';
import echarts from '../../utils/echarts';
import { getBigscreenData } from '../../api/dashboard';
import './index.css';

interface LogItem {
  id: number;
  username: string;
  operation: string;
  ip: string;
  time: number;
  status: number;
  createTime: string;
}

interface BigscreenData {
  userCount: number;
  roleCount: number;
  menuCount: number;
  deptCount: number;
  todayLogCount: number;
  todayLoginCount: number;
  hourlyTrend: { hour: number; count: number }[];
  monthlyTrend: { date: string; count: number }[];
  operationDistribution: { name: string; value: number }[];
  recentLogs: LogItem[];
}

const BigScreen: React.FC = () => {
  const [data, setData] = useState<BigscreenData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const lineRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const pieRef = useRef<HTMLDivElement>(null);
  const gaugeRef = useRef<HTMLDivElement>(null);
  const lineChart = useRef<echarts.ECharts | null>(null);
  const barChart = useRef<echarts.ECharts | null>(null);
  const pieChart = useRef<echarts.ECharts | null>(null);
  const gaugeChart = useRef<echarts.ECharts | null>(null);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data
  useEffect(() => {
    getBigscreenData()
      .then((res: any) => setData(res.data))
      .catch(() => {});

    const interval = setInterval(() => {
      getBigscreenData()
        .then((res: any) => setData(res.data))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Line chart: 30-day trend
  useEffect(() => {
    if (!data || !lineRef.current) return;
    const chart = echarts.init(lineRef.current);
    lineChart.current = chart;
    const trend = data.monthlyTrend || [];
    chart.setOption({
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,20,40,0.85)', borderColor: '#0af', textStyle: { color: '#e0f0ff', fontSize: 12 } },
      grid: { top: 30, right: 20, bottom: 30, left: 50 },
      xAxis: {
        type: 'category',
        data: trend.map(d => String(d.date).slice(5)),
        axisLine: { lineStyle: { color: '#1a3a5c' } },
        axisLabel: { color: '#5a8ab5', fontSize: 10 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value', minInterval: 1,
        splitLine: { lineStyle: { color: '#0d2a45', type: 'dashed' } },
        axisLabel: { color: '#5a8ab5', fontSize: 10 },
      },
      series: [{
        data: trend.map(d => d.count), type: 'line', smooth: true,
        symbol: 'circle', symbolSize: 4,
        lineStyle: { color: '#0af', width: 2 },
        itemStyle: { color: '#0af' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0,170,255,0.3)' },
            { offset: 1, color: 'rgba(0,170,255,0.02)' },
          ]),
        },
      }],
    });
    return () => { chart.dispose(); lineChart.current = null; };
  }, [data]);

  // Bar chart: hourly today
  useEffect(() => {
    if (!data || !barRef.current) return;
    const chart = echarts.init(barRef.current);
    barChart.current = chart;
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const hourMap: Record<number, number> = {};
    (data.hourlyTrend || []).forEach(h => { hourMap[h.hour] = h.count; });
    const values = Array.from({ length: 24 }, (_, i) => hourMap[i] || 0);
    chart.setOption({
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,20,40,0.85)', borderColor: '#0f6', textStyle: { color: '#e0ffe0', fontSize: 12 } },
      grid: { top: 20, right: 15, bottom: 30, left: 45 },
      xAxis: {
        type: 'category', data: hours,
        axisLine: { lineStyle: { color: '#1a3a5c' } },
        axisLabel: { color: '#5a8ab5', fontSize: 9, interval: 2 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value', minInterval: 1,
        splitLine: { lineStyle: { color: '#0d2a45', type: 'dashed' } },
        axisLabel: { color: '#5a8ab5', fontSize: 10 },
      },
      series: [{
        data: values, type: 'bar',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#00ff88' },
            { offset: 1, color: '#006633' },
          ]),
          borderRadius: [2, 2, 0, 0],
        },
        barMaxWidth: 16,
      }],
    });
    return () => { chart.dispose(); barChart.current = null; };
  }, [data]);

  // Pie chart: operation distribution
  useEffect(() => {
    if (!data || !pieRef.current) return;
    const chart = echarts.init(pieRef.current);
    pieChart.current = chart;
    const palette = ['#0af', '#0f6', '#f60', '#f06', '#60f', '#ff0', '#0ff', '#fa0'];
    chart.setOption({
      tooltip: {
        trigger: 'item', backgroundColor: 'rgba(0,20,40,0.85)', borderColor: '#0af',
        textStyle: { color: '#e0f0ff', fontSize: 12 },
      },
      legend: {
        orient: 'vertical', right: 10, top: 'center',
        textStyle: { color: '#7ab5d6', fontSize: 11 },
        itemWidth: 10, itemHeight: 10,
      },
      series: [{
        type: 'pie', radius: ['40%', '68%'], center: ['35%', '50%'],
        label: { show: false },
        emphasis: { label: { show: true, color: '#fff', fontSize: 12 } },
        itemStyle: { borderColor: '#060e1a', borderWidth: 2 },
        data: (data.operationDistribution || []).map((d, i) => ({
          value: d.value, name: d.name,
          itemStyle: { color: palette[i % palette.length] },
        })),
      }],
    });
    return () => { chart.dispose(); pieChart.current = null; };
  }, [data]);

  // Gauge: system health
  useEffect(() => {
    if (!data || !gaugeRef.current) return;
    const chart = echarts.init(gaugeRef.current);
    gaugeChart.current = chart;
    const health = Math.min(100, Math.max(0, 100 - (data.todayLogCount > 500 ? 30 : data.todayLogCount > 200 ? 15 : 0)));
    chart.setOption({
      series: [{
        type: 'gauge', startAngle: 220, endAngle: -40,
        radius: '90%', center: ['50%', '55%'],
        min: 0, max: 100,
        axisLine: {
          lineStyle: {
            width: 12,
            color: [[0.3, '#f06'], [0.7, '#fa0'], [1, '#0f6']],
          },
        },
        pointer: { length: '60%', width: 4, itemStyle: { color: '#0af' } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          valueAnimation: true, fontSize: 22, fontWeight: 700,
          color: '#0af', offsetCenter: [0, '70%'],
          formatter: '{value}%',
        },
        title: { offsetCenter: [0, '90%'], color: '#5a8ab5', fontSize: 12 },
        data: [{ value: health, name: '系统健康度' }],
      }],
    });
    return () => { chart.dispose(); gaugeChart.current = null; };
  }, [data]);

  // Resize
  useEffect(() => {
    const handleResize = () => {
      lineChart.current?.resize();
      barChart.current?.resize();
      pieChart.current?.resize();
      gaugeChart.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleExit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    window.history.back();
  };

  const handleFullscreen = () => {
    const el = document.querySelector('.bigscreen');
    if (el && !document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    }
  };

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('zh-CN', { hour12: false });
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
  };

  const statCards = [
    { label: '用户总数', value: data?.userCount ?? '-', color: '#0af' },
    { label: '部门数量', value: data?.deptCount ?? '-', color: '#0f6' },
    { label: '今日操作', value: data?.todayLogCount ?? '-', color: '#f60' },
    { label: '今日登录', value: data?.todayLoginCount ?? '-', color: '#f06' },
    { label: '角色数量', value: data?.roleCount ?? '-', color: '#60f' },
    { label: '菜单数量', value: data?.menuCount ?? '-', color: '#fa0' },
  ];

  return (
    <div className="bigscreen">
      {/* Header */}
      <div className="bs-header">
        <div className="bs-header-left">
          <span className="bs-date">{formatDate(currentTime)}</span>
        </div>
        <div className="bs-header-center">
          <h1 className="bs-title">Demo Admin 数据可视化大屏</h1>
          <div className="bs-title-line" />
        </div>
        <div className="bs-header-right">
          <span className="bs-time">{formatTime(currentTime)}</span>
          <button className="bs-btn" onClick={handleFullscreen}>全屏</button>
          <button className="bs-btn" onClick={handleExit}>退出</button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="bs-stats">
        {statCards.map((card, i) => (
          <div className="bs-stat-card" key={i}>
            <div className="bs-stat-value" style={{ color: card.color }}>{card.value}</div>
            <div className="bs-stat-label">{card.label}</div>
            <div className="bs-stat-glow" style={{ background: card.color }} />
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="bs-grid">
        {/* Left column */}
        <div className="bs-panel">
          <div className="bs-panel-title">近30天操作趋势</div>
          <div ref={lineRef} style={{ width: '100%', height: 'calc(100% - 36px)' }} />
        </div>

        {/* Center column */}
        <div className="bs-center">
          <div className="bs-panel" style={{ flex: 1 }}>
            <div className="bs-panel-title">今日24小时分布</div>
            <div ref={barRef} style={{ width: '100%', height: 'calc(100% - 36px)' }} />
          </div>
          <div className="bs-panel" style={{ flex: 1 }}>
            <div className="bs-panel-title">实时操作流水</div>
            <div className="bs-log-list">
              {(data?.recentLogs || []).map((log, i) => (
                <div className="bs-log-item" key={log.id} style={{ animationDelay: `${i * 0.1}s` }}>
                  <span className={`bs-log-dot ${log.status === 0 ? 'bs-log-dot-fail' : ''}`} />
                  <span className="bs-log-user">{log.username}</span>
                  <span className="bs-log-op">{log.operation}</span>
                  <span className="bs-log-time">{log.time}ms</span>
                  <span className="bs-log-date">{String(log.createTime).slice(11, 19)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="bs-right">
          <div className="bs-panel" style={{ flex: 1 }}>
            <div className="bs-panel-title">操作类型分布</div>
            <div ref={pieRef} style={{ width: '100%', height: 'calc(100% - 36px)' }} />
          </div>
          <div className="bs-panel" style={{ flex: 1 }}>
            <div className="bs-panel-title">系统健康度</div>
            <div ref={gaugeRef} style={{ width: '100%', height: 'calc(100% - 36px)' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BigScreen;
