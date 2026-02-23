import React, { useState, useCallback, useEffect } from 'react';
import { Badge, Popover, Tag, Empty, Modal, Spin } from 'antd';
import { BellOutlined, NotificationOutlined, SoundOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getLatestNotices, getNoticeById, markNoticeRead, getUnreadCount } from '../api/notice';

const NoticePopover: React.FC = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [noticeDetail, setNoticeDetail] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const loadNotices = useCallback(() => {
    setLoading(true);
    Promise.all([
      getLatestNotices().then((res: any) => res.data || []),
      getUnreadCount().then((res: any) => res.data || 0),
    ])
      .then(([list, count]) => {
        setNotices(list);
        setUnreadCount(count);
        setInitialized(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 仅加载未读数（轻量）
  const refreshUnreadCount = useCallback(() => {
    getUnreadCount().then((res: any) => {
      setUnreadCount(res.data || 0);
    }).catch(() => {});
  }, []);

  // 组件挂载时加载未读数
  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // 监听 WebSocket 通知事件，刷新未读数
  useEffect(() => {
    const handler = () => refreshUnreadCount();
    window.addEventListener('notice-refresh', handler);
    return () => window.removeEventListener('notice-refresh', handler);
  }, [refreshUnreadCount]);

  const handleOpenChange = (open: boolean) => {
    if (open) loadNotices();
  };

  const handleNoticeClick = (notice: any) => {
    if (!notice.read) {
      markNoticeRead(notice.id).then(() => loadNotices()).catch(() => {});
    }
    getNoticeById(notice.id)
      .then((res: any) => {
        setNoticeDetail(res.data || notice);
        setModalOpen(true);
      })
      .catch(() => {
        setNoticeDetail(notice);
        setModalOpen(true);
      });
  };

  return (
    <>
      <Popover
        placement="bottomRight"
        trigger="click"
        title={null}
        onOpenChange={handleOpenChange}
        content={
          <div className="notice-popover">
            <div className="notice-popover-header">通知公告</div>
            {loading && !initialized ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}><Spin /></div>
            ) : notices.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无通知" />
            ) : (
              <div className="notice-popover-list">
                {notices.map((n: any) => (
                  <div
                    className={`notice-popover-item ${n.read ? 'notice-read' : 'notice-unread'}`}
                    key={n.id}
                    onClick={() => handleNoticeClick(n)}
                  >
                    <div className="notice-popover-icon">
                      {n.type === 1 ? <NotificationOutlined /> : <SoundOutlined />}
                    </div>
                    <div className="notice-popover-content">
                      <div className="notice-popover-title">{n.title}</div>
                      <div className="notice-popover-meta">
                        <Tag color={n.type === 1 ? 'blue' : 'green'} style={{ fontSize: 11 }}>
                          {n.type === 1 ? '通知' : '公告'}
                        </Tag>
                        <span>{n.createBy}</span>
                        {!n.read && <span className="notice-unread-dot" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {notices.length > 0 && (
              <div className="notice-popover-footer" onClick={() => navigate('/system/notice')}>
                查看全部
              </div>
            )}
          </div>
        }
      >
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <span className="header-bell">
            <BellOutlined />
          </span>
        </Badge>
      </Popover>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={520}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {noticeDetail?.type === 1 ? <NotificationOutlined style={{ color: '#1677ff' }} /> : <SoundOutlined style={{ color: '#52c41a' }} />}
            <span>{noticeDetail?.title}</span>
          </div>
        }
      >
        {noticeDetail && (
          <div className="notice-detail">
            <div className="notice-detail-meta">
              <Tag color={noticeDetail.type === 1 ? 'blue' : 'green'}>
                {noticeDetail.type === 1 ? '通知' : '公告'}
              </Tag>
              <span>发布人：{noticeDetail.createBy}</span>
              <span>{noticeDetail.createTime}</span>
            </div>
            {noticeDetail.content ? (
              <div className="notice-detail-content" dangerouslySetInnerHTML={{ __html: noticeDetail.content }} />
            ) : (
              <div className="notice-detail-content">暂无内容</div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default NoticePopover;
