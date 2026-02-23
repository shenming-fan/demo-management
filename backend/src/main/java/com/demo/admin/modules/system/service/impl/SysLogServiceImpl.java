package com.demo.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.admin.modules.system.entity.SysLog;
import com.demo.admin.modules.system.mapper.SysLogMapper;
import com.demo.admin.modules.system.service.SysLogService;
import org.springframework.stereotype.Service;

/**
 * 操作日志 Service 实现
 */
@Service
public class SysLogServiceImpl extends ServiceImpl<SysLogMapper, SysLog> implements SysLogService {
}
