import React, { useState, useEffect, useCallback } from 'react';
import {
  Space, Table, Button, Input, Form, Select, Tag, message,
  Popconfirm, Modal, Upload, Image, Tooltip, Spin,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  SearchOutlined, ReloadOutlined, UploadOutlined, DeleteOutlined,
  DownloadOutlined, EyeOutlined, FileOutlined, FileImageOutlined,
  FilePdfOutlined, FileExcelOutlined, FileWordOutlined, FileZipOutlined,
  FileTextOutlined, InboxOutlined, PlayCircleOutlined, SoundOutlined,
} from '@ant-design/icons';
import { getFilePage, uploadFile, deleteFile, deleteFileBatch, downloadFile } from '../../../api/file';
import { useAuth } from '../../../store/AuthContext';

const { Dragger } = Upload;

interface FileData {
  id: number;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  url: string;
  createBy: string;
  createTime: string;
}

/** 文件类型判断 */
const isImage = (fileType: string) => fileType?.startsWith('image/');
const isPdf = (fileType: string) => fileType?.includes('pdf');
const isVideo = (fileType: string) => fileType?.startsWith('video/');
const isAudio = (fileType: string) => fileType?.startsWith('audio/');
const isText = (fileType: string) =>
  fileType?.startsWith('text/') ||
  fileType?.includes('json') ||
  fileType?.includes('xml') ||
  fileType?.includes('javascript') ||
  fileType?.includes('yaml');
const isPreviewable = (fileType: string) =>
  isImage(fileType) || isPdf(fileType) || isVideo(fileType) || isAudio(fileType) || isText(fileType);

/** 格式化文件大小 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
};

/** 根据文件类型返回图标 */
const getFileIcon = (fileType: string) => {
  if (!fileType) return <FileOutlined style={{ fontSize: 32, color: '#999' }} />;
  if (fileType.startsWith('image/')) return <FileImageOutlined style={{ fontSize: 32, color: 'var(--color-primary)' }} />;
  if (fileType.includes('pdf')) return <FilePdfOutlined style={{ fontSize: 32, color: '#C75450' }} />;
  if (fileType.startsWith('video/')) return <PlayCircleOutlined style={{ fontSize: 32, color: '#722ED1' }} />;
  if (fileType.startsWith('audio/')) return <SoundOutlined style={{ fontSize: 32, color: '#13C2C2' }} />;
  if (fileType.includes('sheet') || fileType.includes('excel')) return <FileExcelOutlined style={{ fontSize: 32, color: '#5B8C5A' }} />;
  if (fileType.includes('word') || fileType.includes('document')) return <FileWordOutlined style={{ fontSize: 32, color: '#4A90D9' }} />;
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z') || fileType.includes('gzip')) return <FileZipOutlined style={{ fontSize: 32, color: '#D4A853' }} />;
  if (fileType.startsWith('text/')) return <FileTextOutlined style={{ fontSize: 32, color: '#666' }} />;
  return <FileOutlined style={{ fontSize: 32, color: '#999' }} />;
};

/** 文件类型筛选选项 */
const fileTypeOptions = [
  { label: '图片', value: 'image/' },
  { label: 'PDF', value: 'application/pdf' },
  { label: '视频', value: 'video/' },
  { label: '音频', value: 'audio/' },
  { label: 'Word', value: 'application/vnd.openxmlformats-officedocument.wordprocessingml' },
  { label: 'Excel', value: 'application/vnd.openxmlformats-officedocument.spreadsheetml' },
  { label: '压缩包', value: 'application/zip' },
  { label: '文本', value: 'text/' },
];

const FilePage: React.FC = () => {
  const [data, setData] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchForm] = Form.useForm();
  const { hasPermission } = useAuth();
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1, pageSize: 10, total: 0,
  });
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewRecord, setPreviewRecord] = useState<FileData | null>(null);
  const [textContent, setTextContent] = useState('');
  const [textLoading, setTextLoading] = useState(false);

  const loadData = async (params?: Record<string, number>) => {
    setLoading(true);
    try {
      const res: any = await getFilePage({
        current: params?.current || pagination.current as number,
        size: params?.pageSize || pagination.pageSize as number,
        ...searchForm.getFieldsValue(),
      });
      setData(res.data.records);
      setPagination({
        ...pagination,
        current: res.data.current,
        pageSize: res.data.size,
        total: res.data.total,
      });
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    loadData({ current: 1 });
  };

  const handleReset = () => {
    searchForm.resetFields();
    setPagination({ ...pagination, current: 1 });
    loadData({ current: 1 });
  };

  const handleTableChange = (pag: TablePaginationConfig) => {
    loadData({ current: pag.current as number, pageSize: pag.pageSize as number });
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteFile(id);
      message.success('删除成功');
      loadData();
    } catch {
      // handled by interceptor
    }
  };

  const handleBatchDelete = async () => {
    try {
      await deleteFileBatch(selectedRowKeys as number[]);
      message.success('批量删除成功');
      setSelectedRowKeys([]);
      loadData();
    } catch {
      // handled by interceptor
    }
  };

  const handleDownload = async (record: FileData) => {
    try {
      const blob: any = await downloadFile(record.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', record.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      message.error('下载失败');
    }
  };

  const handlePreview = useCallback(async (record: FileData) => {
    const url = '/api' + record.url;
    setPreviewUrl(url);
    setPreviewRecord(record);
    setTextContent('');

    if (isText(record.fileType)) {
      setPreviewOpen(true);
      setTextLoading(true);
      try {
        const resp = await fetch(url);
        const text = await resp.text();
        setTextContent(text);
      } catch {
        setTextContent('文件内容加载失败');
      } finally {
        setTextLoading(false);
      }
    } else {
      setPreviewOpen(true);
    }
  }, []);

  const handleUpload = async (file: File) => {
    try {
      await uploadFile(file);
      message.success('上传成功');
      loadData();
    } catch {
      // handled by interceptor
    }
    return false; // prevent default upload
  };

  const columns: ColumnsType<FileData> = [
    {
      title: '预览', dataIndex: 'url', key: 'preview', width: 80, align: 'center',
      render: (url: string, record: FileData) => {
        if (isImage(record.fileType)) {
          return (
            <img
              src={'/api' + url}
              alt={record.originalName}
              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
              onClick={() => handlePreview(record)}
            />
          );
        }
        return getFileIcon(record.fileType);
      },
    },
    {
      title: '文件名', dataIndex: 'originalName', key: 'originalName', ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>{text}</Tooltip>
      ),
    },
    {
      title: '文件类型', dataIndex: 'fileType', key: 'fileType', width: 160, ellipsis: true,
      render: (type: string) => {
        if (!type) return '-';
        if (type.startsWith('image/')) return <Tag color="orange">图片</Tag>;
        if (type.includes('pdf')) return <Tag color="red">PDF</Tag>;
        if (type.startsWith('video/')) return <Tag color="purple">视频</Tag>;
        if (type.startsWith('audio/')) return <Tag color="cyan">音频</Tag>;
        if (type.includes('sheet') || type.includes('excel')) return <Tag color="green">Excel</Tag>;
        if (type.includes('word') || type.includes('document')) return <Tag color="blue">Word</Tag>;
        if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return <Tag color="gold">压缩包</Tag>;
        if (type.startsWith('text/')) return <Tag>文本</Tag>;
        return <Tag>{type}</Tag>;
      },
    },
    {
      title: '文件大小', dataIndex: 'fileSize', key: 'fileSize', width: 110,
      render: (size: number) => formatFileSize(size),
    },
    { title: '上传人', dataIndex: 'createBy', key: 'createBy', width: 100 },
    { title: '上传时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
    {
      title: '操作', key: 'action', width: 180, fixed: 'right',
      render: (_, record) => (
        <Space>
          {isPreviewable(record.fileType) && (
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record)}>
              预览
            </Button>
          )}
          {hasPermission('system:file:download') && (
            <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(record)}>
              下载
            </Button>
          )}
          {hasPermission('system:file:delete') && (
            <Popconfirm title="确定删除该文件吗？" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ animation: 'fadeSlideUp 0.45s ease-out' }}>
      <div className="page-search">
        <Form form={searchForm} layout="inline">
          <Form.Item label="文件名" name="originalName">
            <Input placeholder="请输入文件名" allowClear style={{ width: 180 }} />
          </Form.Item>
          <Form.Item label="文件类型" name="fileType">
            <Select placeholder="请选择" style={{ width: 140 }} allowClear>
              {fileTypeOptions.map(opt => (
                <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="page-toolbar">
        <span className="page-toolbar-title">文件管理</span>
        <Space>
          {hasPermission('system:file:delete') && selectedRowKeys.length > 0 && (
            <Popconfirm title={`确定删除选中的 ${selectedRowKeys.length} 个文件吗？`} onConfirm={handleBatchDelete}>
              <Button danger icon={<DeleteOutlined />}>批量删除</Button>
            </Popconfirm>
          )}
          {hasPermission('system:file:upload') && (
            <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModalOpen(true)}>
              上传文件
            </Button>
          )}
        </Space>
      </div>

      <div className="page-table-card">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          scroll={{ x: 900 }}
        />
      </div>

      {/* 上传文件弹窗 */}
      <Modal
        title="上传文件"
        open={uploadModalOpen}
        footer={null}
        onCancel={() => setUploadModalOpen(false)}
        width={520}
        destroyOnClose
      >
        <Dragger
          name="file"
          multiple
          showUploadList
          customRequest={({ file }) => handleUpload(file as File)}
          style={{ padding: '20px 0' }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ color: 'var(--color-primary)', fontSize: 48 }} />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持图片、文档、表格、PDF、压缩包等文件，单文件最大 50MB
          </p>
        </Dragger>
      </Modal>

      {/* 文件预览弹窗 */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            <span>文件预览 - {previewRecord?.originalName}</span>
          </Space>
        }
        open={previewOpen && !!previewRecord && !isImage(previewRecord.fileType)}
        onCancel={() => { setPreviewOpen(false); setPreviewRecord(null); }}
        footer={null}
        width={isPdf(previewRecord?.fileType || '') || isVideo(previewRecord?.fileType || '') ? 900 : 700}
        destroyOnClose
        styles={{ body: { padding: '16px 24px' } }}
      >
        {previewRecord && isPdf(previewRecord.fileType) && (
          <iframe
            src={previewUrl}
            style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8 }}
            title="PDF Preview"
          />
        )}
        {previewRecord && isVideo(previewRecord.fileType) && (
          <video
            src={previewUrl}
            controls
            autoPlay
            style={{ width: '100%', maxHeight: '70vh', borderRadius: 8, background: '#000' }}
          >
            您的浏览器不支持视频播放
          </video>
        )}
        {previewRecord && isAudio(previewRecord.fileType) && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <SoundOutlined style={{ fontSize: 64, color: 'var(--color-primary)', marginBottom: 24 }} />
            <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
              {previewRecord.originalName}
            </div>
            <audio
              src={previewUrl}
              controls
              autoPlay
              style={{ width: '100%', maxWidth: 500 }}
            >
              您的浏览器不支持音频播放
            </audio>
          </div>
        )}
        {previewRecord && isText(previewRecord.fileType) && (
          textLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin tip="加载中..." />
            </div>
          ) : (
            <pre style={{
              background: 'var(--bg-secondary, #f5f5f5)',
              padding: 16,
              borderRadius: 8,
              maxHeight: '65vh',
              overflow: 'auto',
              fontSize: 13,
              lineHeight: 1.6,
              fontFamily: "'Cascadia Code', 'Fira Code', 'Source Code Pro', Consolas, monospace",
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              margin: 0,
            }}>
              {textContent}
            </pre>
          )
        )}
      </Modal>

      {/* 图片预览 */}
      <Image
        style={{ display: 'none' }}
        preview={{
          visible: previewOpen && !!previewRecord && isImage(previewRecord?.fileType || ''),
          src: previewUrl,
          onVisibleChange: (visible) => { setPreviewOpen(visible); if (!visible) setPreviewRecord(null); },
        }}
      />
    </div>
  );
};

export default FilePage;
