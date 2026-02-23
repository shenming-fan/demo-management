import axios from 'axios';
import { message } from 'antd';

/**
 * 下载文件（用于导出 Excel 等二进制文件）
 */
export async function downloadFile(url: string, params?: Record<string, unknown>) {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('/api' + url, {
      params,
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    // 从 Content-Disposition 提取文件名
    const disposition = response.headers['content-disposition'] || '';
    const match = disposition.match(/filename=(.+)/);
    const filename = match ? decodeURIComponent(match[1]) : '导出文件.xlsx';

    // 创建下载链接
    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch {
    message.error('导出失败');
  }
}
