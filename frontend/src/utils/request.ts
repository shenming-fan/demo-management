import axios from 'axios';
import { message } from 'antd';

// 创建 axios 实例
const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// ========= 错误提示去重 =========
let lastErrorMsg = '';
let lastErrorTime = 0;
const ERROR_DEDUP_MS = 2000; // 2秒内相同消息不重复弹

function showError(msg: string) {
  const now = Date.now();
  if (msg === lastErrorMsg && now - lastErrorTime < ERROR_DEDUP_MS) return;
  lastErrorMsg = msg;
  lastErrorTime = now;
  message.error(msg);
}

// ========= 401 跳转去重 =========
let isRedirecting = false;
function redirectToLogin() {
  if (isRedirecting) return;
  isRedirecting = true;
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  window.location.href = '/login';
}

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // blob 响应（如文件下载）直接返回
    if (response.config.responseType === 'blob') {
      return response.data;
    }
    const res = response.data;
    if (res.code !== 200) {
      showError(res.message || '请求失败');
      if (res.code === 401) {
        redirectToLogin();
      }
      return Promise.reject(new Error(res.message || 'Error'));
    }
    return res;
  },
  (error) => {
    if (axios.isCancel(error)) {
      // 被取消的请求不弹错误
      return Promise.reject(error);
    }
    console.error('请求错误:', error);
    if (error.response?.status === 401) {
      redirectToLogin();
    } else {
      showError(error.response?.data?.message || error.message || '网络错误');
    }
    return Promise.reject(error);
  }
);

export default request;
