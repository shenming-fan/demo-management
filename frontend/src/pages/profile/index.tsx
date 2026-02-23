import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tabs, Form, Input, Select, Button, Avatar, message, Upload, Modal, Slider, Space, Table, Tag, Popconfirm, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  UserOutlined, LockOutlined, PhoneOutlined, MailOutlined,
  CameraOutlined, RotateLeftOutlined, RotateRightOutlined,
  ZoomInOutlined, ZoomOutOutlined, UndoOutlined,
  LaptopOutlined, AppleOutlined, WindowsOutlined,
  AndroidOutlined, LogoutOutlined, DeleteOutlined,
} from '@ant-design/icons';
import ReactCropper, { type ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { useAuth } from '../../store/AuthContext';
import PasswordStrength from '../../components/PasswordStrength';
import { updateProfile, updatePassword, updateAvatar, getLoginSessions, logoutSession, logoutOtherSessions } from '../../api/auth';

/** 包装组件：使用 Form.useWatch 实现密码强度实时更新 */
const PasswordStrengthWatcher: React.FC<{ form: ReturnType<typeof Form.useForm>[0] }> = ({ form }) => {
  const newPassword = Form.useWatch('newPassword', form);
  return <PasswordStrength password={newPassword || ''} />;
};

const ProfilePage: React.FC = () => {
  const { userInfo, loadAuthData } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // 裁剪弹窗相关
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImage, setCropImage] = useState('');
  const [zoom, setZoom] = useState(1);
  const cropperRef = useRef<ReactCropperElement>(null);

  /** 选择图片后打开裁剪弹窗 */
  const handleSelectFile = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error('图片不能超过 5MB');
      return false;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result as string);
      setZoom(1);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    return false;
  };

  /** 旋转 */
  const handleRotate = useCallback((degree: number) => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      cropper.rotate(degree);
    }
  }, []);

  /** 缩放 */
  const handleZoomChange = useCallback((value: number) => {
    setZoom(value);
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      cropper.zoomTo(value);
    }
  }, []);

  /** 重置裁剪 */
  const handleReset = useCallback(() => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      cropper.reset();
      setZoom(1);
    }
  }, []);

  /** 确认裁剪并上传 */
  const handleCropConfirm = async () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({
      width: 256,
      height: 256,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });

    canvas.toBlob(async (blob) => {
      if (!blob) {
        message.error('图片裁剪失败');
        return;
      }
      const file = new File([blob], 'avatar.png', { type: 'image/png' });
      setAvatarLoading(true);
      setCropModalOpen(false);
      try {
        await updateAvatar(file);
        message.success('头像修改成功');
        await loadAuthData();
      } catch {
        // handled by interceptor
      } finally {
        setAvatarLoading(false);
      }
    }, 'image/png');
  };

  /** 加载登录设备列表 */
  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res: any = await getLoginSessions();
      setSessions(res.data || []);
    } catch {
      // handled
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  /** 退出指定设备 */
  const handleLogoutDevice = async (tokenKey: string) => {
    try {
      await logoutSession(tokenKey);
      message.success('已退出该设备');
      loadSessions();
    } catch {
      // handled
    }
  };

  /** 退出其他所有设备 */
  const handleLogoutOther = async () => {
    try {
      await logoutOtherSessions();
      message.success('已退出其他所有设备');
      loadSessions();
    } catch {
      // handled
    }
  };

  /** 获取操作系统图标 */
  const getOsIcon = (os: string) => {
    if (os?.includes('Windows')) return <WindowsOutlined />;
    if (os?.includes('macOS') || os?.includes('iOS')) return <AppleOutlined />;
    if (os?.includes('Android')) return <AndroidOutlined />;
    return <LaptopOutlined />;
  };

  /** 格式化登录时间 */
  const formatLoginTime = (timestamp: number) => {
    if (!timestamp) return '-';
    const d = new Date(timestamp);
    return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const sessionColumns: ColumnsType<any> = [
    {
      title: '设备', key: 'device', width: 200,
      render: (_, record) => (
        <Space>
          {getOsIcon(record.os)}
          <span>{record.browser} · {record.os}</span>
        </Space>
      ),
    },
    {
      title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 140,
    },
    {
      title: '登录时间', key: 'loginTime', width: 170,
      render: (_, record) => formatLoginTime(record.loginTime),
    },
    {
      title: '状态', key: 'status', width: 100,
      render: (_, record) => (
        record.current
          ? <Tag color="green">当前设备</Tag>
          : <Tag>在线</Tag>
      ),
    },
    {
      title: '操作', key: 'action', width: 100,
      render: (_, record) => (
        !record.current ? (
          <Popconfirm title="确定退出该设备吗？" onConfirm={() => handleLogoutDevice(record.tokenKey)}>
            <Button type="link" danger size="small" icon={<LogoutOutlined />}>退出</Button>
          </Popconfirm>
        ) : (
          <Tooltip title="当前设备"><span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>-</span></Tooltip>
        )
      ),
    },
  ];

  useEffect(() => {
    if (userInfo) {
      profileForm.setFieldsValue({
        nickname: userInfo.nickname,
        phone: userInfo.phone,
        email: userInfo.email,
        gender: userInfo.gender,
      });
    }
  }, [userInfo, profileForm]);

  const handleProfileSubmit = async (values: Record<string, unknown>) => {
    setProfileLoading(true);
    try {
      await updateProfile(values as { nickname?: string; phone?: string; email?: string; gender?: number });
      message.success('个人信息修改成功');
      await loadAuthData();
    } catch {
      // handled by interceptor
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: Record<string, string>) => {
    setPasswordLoading(true);
    try {
      await updatePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      message.success('密码修改成功，请重新登录');
      passwordForm.resetFields();
    } catch {
      // handled by interceptor
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ animation: 'fadeSlideUp 0.45s ease-out' }}>
      <div className="profile-container">
        <div className="profile-header">
          <Upload
            showUploadList={false}
            beforeUpload={(file) => handleSelectFile(file as File)}
            accept="image/*"
          >
            <div className="profile-avatar-wrapper" style={{ position: 'relative', cursor: 'pointer', width: 72, height: 72 }}>
              <Avatar
                size={72}
                icon={<UserOutlined />}
                src={userInfo?.avatar ? '/api' + userInfo.avatar : undefined}
                style={{ background: 'linear-gradient(135deg, var(--color-primary), #D4A853)' }}
              />
              <div
                className="profile-avatar-overlay"
                style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  borderRadius: '50%', background: 'rgba(0,0,0,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.3s',
                  color: '#fff', fontSize: 20,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0'; }}
              >
                <CameraOutlined />
              </div>
            </div>
          </Upload>
          <div className="profile-header-info">
            <h3>{userInfo?.nickname || userInfo?.username || '管理员'}</h3>
            <p>{userInfo?.username}</p>
          </div>
        </div>

        <Tabs
          defaultActiveKey="info"
          onChange={(key) => { if (key === 'devices') loadSessions(); }}
          items={[
            {
              key: 'info',
              label: '基本信息',
              children: (
                <Form
                  form={profileForm}
                  layout="vertical"
                  onFinish={handleProfileSubmit}
                  style={{ maxWidth: 480 }}
                >
                  <Form.Item label="用户名">
                    <Input value={userInfo?.username} disabled prefix={<UserOutlined />} />
                  </Form.Item>
                  <Form.Item
                    label="昵称"
                    name="nickname"
                    rules={[{ required: true, message: '请输入昵称' }]}
                  >
                    <Input placeholder="请输入昵称" prefix={<UserOutlined />} />
                  </Form.Item>
                  <Form.Item label="手机号" name="phone">
                    <Input placeholder="请输入手机号" prefix={<PhoneOutlined />} />
                  </Form.Item>
                  <Form.Item
                    label="邮箱"
                    name="email"
                    rules={[{ type: 'email', message: '请输入正确的邮箱格式' }]}
                  >
                    <Input placeholder="请输入邮箱" prefix={<MailOutlined />} />
                  </Form.Item>
                  <Form.Item label="性别" name="gender">
                    <Select placeholder="请选择性别" allowClear>
                      <Select.Option value={0}>未知</Select.Option>
                      <Select.Option value={1}>男</Select.Option>
                      <Select.Option value={2}>女</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={profileLoading}>
                      保存修改
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'password',
              label: '修改密码',
              children: (
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handlePasswordSubmit}
                  style={{ maxWidth: 480 }}
                >
                  <Form.Item
                    label="旧密码"
                    name="oldPassword"
                    rules={[{ required: true, message: '请输入旧密码' }]}
                  >
                    <Input.Password placeholder="请输入旧密码" prefix={<LockOutlined />} />
                  </Form.Item>
                  <Form.Item
                    label="新密码"
                    name="newPassword"
                    rules={[
                      { required: true, message: '请输入新密码' },
                      { min: 6, message: '密码长度不能少于6位' },
                    ]}
                  >
                    <Input.Password placeholder="请输入新密码" prefix={<LockOutlined />} />
                  </Form.Item>
                  <PasswordStrengthWatcher form={passwordForm} />
                  <Form.Item
                    label="确认新密码"
                    name="confirmPassword"
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: '请确认新密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('两次输入的密码不一致'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password placeholder="请再次输入新密码" prefix={<LockOutlined />} />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={passwordLoading}>
                      修改密码
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'devices',
              label: '登录设备',
              children: (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      当前共 {sessions.length} 个在线设备
                    </span>
                    {sessions.filter(s => !s.current).length > 0 && (
                      <Popconfirm title="确定退出其他所有设备吗？" onConfirm={handleLogoutOther}>
                        <Button danger size="small" icon={<DeleteOutlined />}>退出其他设备</Button>
                      </Popconfirm>
                    )}
                  </div>
                  <Table
                    columns={sessionColumns}
                    dataSource={sessions}
                    rowKey="tokenKey"
                    loading={sessionsLoading}
                    pagination={false}
                    size="small"
                  />
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* 头像裁剪弹窗 */}
      <Modal
        title="裁剪头像"
        open={cropModalOpen}
        onCancel={() => setCropModalOpen(false)}
        onOk={handleCropConfirm}
        okText="确认上传"
        cancelText="取消"
        confirmLoading={avatarLoading}
        width={560}
        destroyOnClose
        styles={{ body: { padding: '16px 0' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 裁剪区域 */}
          <div style={{
            width: '100%',
            height: 360,
            background: '#1a1a1a',
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            <ReactCropper
              ref={cropperRef}
              src={cropImage}
              style={{ height: '100%', width: '100%' }}
              aspectRatio={1}
              viewMode={1}
              dragMode="move"
              autoCropArea={0.8}
              cropBoxMovable={false}
              cropBoxResizable={false}
              toggleDragModeOnDblclick={false}
              center
              guides={false}
              highlight={false}
              background={false}
            />
          </div>

          {/* 操作工具栏 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '0 8px',
          }}>
            {/* 缩放 */}
            <ZoomOutOutlined style={{ fontSize: 16, color: '#999' }} />
            <Slider
              min={0.1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={handleZoomChange}
              tooltip={{ formatter: (v) => `${Math.round((v || 1) * 100)}%` }}
              style={{ flex: 1 }}
            />
            <ZoomInOutlined style={{ fontSize: 16, color: '#999' }} />

            {/* 分隔 */}
            <div style={{ width: 1, height: 24, background: '#e8e8e8' }} />

            {/* 旋转 & 重置 */}
            <Space>
              <Button
                icon={<RotateLeftOutlined />}
                onClick={() => handleRotate(-90)}
                title="逆时针旋转 90°"
              />
              <Button
                icon={<RotateRightOutlined />}
                onClick={() => handleRotate(90)}
                title="顺时针旋转 90°"
              />
              <Button
                icon={<UndoOutlined />}
                onClick={handleReset}
                title="重置"
              />
            </Space>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;
