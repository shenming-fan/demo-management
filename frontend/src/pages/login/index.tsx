import React, { useState, useEffect, useCallback } from 'react';
import { LockOutlined, UserOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { login, getCaptcha } from '../../api/auth';
import { useAuth } from '../../store/AuthContext';

const REMEMBER_KEY = 'login_remember';

/** 读取记住的用户名 */
function getRemembered(): { username: string; remember: boolean } {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return { username: data.username || '', remember: true };
    }
  } catch { /* ignore */ }
  return { username: '', remember: false };
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [captchaKey, setCaptchaKey] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const { loadAuthData } = useAuth();

  const remembered = getRemembered();

  const refreshCaptcha = useCallback(async () => {
    try {
      const res: any = await getCaptcha();
      setCaptchaKey(res.data.key);
      setCaptchaImage(res.data.image);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshCaptcha();
  }, [refreshCaptcha]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res: any = await login({
        username: values.username,
        password: values.password,
        captcha: values.captcha,
        captchaKey,
      });
      // 记住我：保存用户名
      if (values.remember) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ username: values.username }));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      localStorage.setItem('token', res.data.token);
      await loadAuthData();
      message.success('登录成功');
      navigate('/dashboard');
    } catch {
      // 登录失败时刷新验证码
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-decor">
        <div className="login-decor-grid" />
        <div className="login-decor-content">
          <div className="login-decor-badge">Enterprise</div>
          <div className="login-decor-brand">
            Demo<br />Admin
          </div>
          <div className="login-decor-sub">Management System</div>
          <div className="login-decor-quote">
            简洁高效的后台管理，<br />让每一次操作都从容不迫。
          </div>
          <div className="login-decor-features">
            <div className="login-feature-item">
              <div className="login-feature-dot" />
              <span>RBAC 权限控制</span>
            </div>
            <div className="login-feature-item">
              <div className="login-feature-dot" />
              <span>数据可视化仪表盘</span>
            </div>
            <div className="login-feature-item">
              <div className="login-feature-dot" />
              <span>完整的系统管理</span>
            </div>
          </div>
        </div>
        <div className="login-decor-shapes">
          <div className="login-shape" />
          <div className="login-shape" />
          <div className="login-shape" />
          <div className="login-shape" />
          <div className="login-shape" />
        </div>
      </div>
      <div className="login-form-side">
        <div className="login-form-container">
          <div className="login-form-header">
            <div className="login-form-title">欢迎回来</div>
            <div className="login-form-desc">请输入账号和密码登录系统</div>
          </div>
          <Form
            name="login"
            initialValues={{ remember: remembered.remember, username: remembered.username }}
            onFinish={onFinish}
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#7A756E' }} />}
                placeholder="账号"
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#7A756E' }} />}
                placeholder="密码"
              />
            </Form.Item>
            <Form.Item>
              <div className="login-captcha-row">
                <Form.Item
                  name="captcha"
                  noStyle
                  rules={[{ required: true, message: '请输入验证码' }]}
                >
                  <Input
                    prefix={<SafetyCertificateOutlined style={{ color: '#7A756E' }} />}
                    placeholder="验证码"
                    style={{ flex: 1 }}
                  />
                </Form.Item>
                <img
                  src={captchaImage}
                  alt="验证码"
                  className="login-captcha-img"
                  onClick={refreshCaptcha}
                  title="点击刷新验证码"
                />
              </div>
            </Form.Item>
            <Form.Item>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>记住我</Checkbox>
                </Form.Item>
                <a
                  onClick={e => e.preventDefault()}
                  style={{ color: 'var(--color-primary)', fontSize: 13 }}
                >
                  忘记密码?
                </a>
              </div>
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                className="login-submit-btn"
              >
                登录
              </Button>
            </Form.Item>
          </Form>
          <div className="login-footer">
            <span>Demo Admin</span>
            <span className="login-footer-divider" />
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
