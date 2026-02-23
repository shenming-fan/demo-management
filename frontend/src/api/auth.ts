import request from '../utils/request';

// 获取验证码
export function getCaptcha() {
  return request.get('/auth/captcha');
}

// 登录
export function login(data: { username: string; password: string; captcha: string; captchaKey: string }) {
  return request.post('/auth/login', data);
}

// 获取用户信息
export function getUserInfo() {
  return request.get('/auth/info');
}

// 获取用户菜单
export function getUserMenus() {
  return request.get('/auth/menus');
}

// 修改个人信息
export function updateProfile(data: { nickname?: string; phone?: string; email?: string; gender?: number }) {
  return request.put('/auth/profile', data);
}

// 修改密码
export function updatePassword(data: { oldPassword: string; newPassword: string }) {
  return request.put('/auth/password', data);
}

// 登出
export function logout() {
  return request.post('/auth/logout');
}

// 修改头像
export function updateAvatar(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// 获取当前用户登录设备列表
export function getLoginSessions() {
  return request.get('/auth/sessions');
}

// 退出指定设备
export function logoutSession(tokenKey: string) {
  return request.delete(`/auth/sessions/${tokenKey}`);
}

// 退出其他所有设备
export function logoutOtherSessions() {
  return request.delete('/auth/sessions/other');
}
