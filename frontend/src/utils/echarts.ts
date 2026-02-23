/**
 * ECharts 按需引入 - 减少约500KB bundle体积
 * 所有页面统一从此文件导入 echarts
 */
import * as echarts from 'echarts/core';

import { LineChart, BarChart, PieChart, GaugeChart } from 'echarts/charts';

import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components';

import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  GaugeChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CanvasRenderer,
]);

export default echarts;
