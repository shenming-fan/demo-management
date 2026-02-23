package com.demo.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.admin.modules.system.entity.SysLoginLog;
import com.demo.admin.modules.system.mapper.SysLoginLogMapper;
import com.demo.admin.modules.system.service.SysLoginLogService;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * 登录日志 Service 实现
 */
@Service
public class SysLoginLogServiceImpl extends ServiceImpl<SysLoginLogMapper, SysLoginLog> implements SysLoginLogService {

    @Async
    @Override
    public void recordLoginLog(String username, Integer status, String message, String ip, String userAgent) {
        SysLoginLog log = new SysLoginLog();
        log.setUsername(username);
        log.setStatus(status);
        log.setMessage(message);
        log.setIp(ip);
        // 截断过长的UA
        if (userAgent != null && userAgent.length() > 500) {
            userAgent = userAgent.substring(0, 500);
        }
        log.setUserAgent(userAgent);
        save(log);
    }
}
