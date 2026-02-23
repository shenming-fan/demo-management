package com.demo.admin.modules.system.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.admin.modules.system.entity.SysLoginLog;

/**
 * 登录日志 Service
 */
public interface SysLoginLogService extends IService<SysLoginLog> {

    /**
     * 记录登录日志
     */
    void recordLoginLog(String username, Integer status, String message, String ip, String userAgent);
}
