import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './store/AuthContext'
import { ThemeProvider, useTheme } from './store/ThemeContext'
import { TabProvider } from './store/TabContext'
import router from './router'
import './index.css'

const componentOverrides = {
  Button: { primaryShadow: 'none', borderRadius: 8 },
  Input: { borderRadius: 8 },
  Select: { borderRadius: 8 },
  Table: { borderRadius: 10, headerBg: '#FAF8F5', headerColor: '#7A756E' },
  Card: { borderRadius: 10 },
  Modal: { borderRadius: 12 },
};

const darkComponentOverrides = {
  ...componentOverrides,
  Table: { borderRadius: 10, headerBg: '#1f1f1f', headerColor: '#8c8c8c' },
};

const ThemedApp: React.FC = () => {
  const { isDark, colorScheme } = useTheme();

  const lightTokens = {
    colorPrimary: colorScheme.primary,
    colorSuccess: colorScheme.success,
    colorError: colorScheme.danger,
    colorWarning: colorScheme.gold,
    colorInfo: colorScheme.primary,
    borderRadius: 8,
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F5F0EB',
    colorBorder: '#E8E2DA',
    colorText: '#2D2A26',
    colorTextSecondary: '#7A756E',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    fontSize: 14,
    controlHeight: 36,
  };

  const darkTokens = {
    ...lightTokens,
    colorBgContainer: '#1f1f1f',
    colorBgLayout: '#141414',
    colorBorder: '#303030',
    colorText: '#e8e8e8',
    colorTextSecondary: '#8c8c8c',
  };

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: isDark ? darkTokens : lightTokens,
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        components: isDark ? darkComponentOverrides : componentOverrides,
      }}
    >
      <AuthProvider>
        <TabProvider>
          <RouterProvider router={router} />
        </TabProvider>
      </AuthProvider>
    </ConfigProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  </React.StrictMode>,
)
