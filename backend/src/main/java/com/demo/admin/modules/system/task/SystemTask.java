package com.demo.admin.modules.system.task;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.demo.admin.modules.system.entity.SysLog;
import com.demo.admin.modules.system.entity.SysLoginLog;
import com.demo.admin.modules.system.entity.SysJobLog;
import com.demo.admin.modules.system.mapper.SysLogMapper;
import com.demo.admin.modules.system.mapper.SysLoginLogMapper;
import com.demo.admin.modules.system.mapper.SysJobLogMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 系统维护定时任务
 */
@Component("systemTask")
public class SystemTask {

    private static final Logger log = LoggerFactory.getLogger(SystemTask.class);

    @Autowired
    private SysLogMapper logMapper;

    @Autowired
    private SysLoginLogMapper loginLogMapper;

    @Autowired
    private SysJobLogMapper jobLogMapper;

    /**
     * 清理30天前的登录日志
     */
    public void cleanLoginLog() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(30);
        int count = loginLogMapper.delete(
                new LambdaQueryWrapper<SysLoginLog>().lt(SysLoginLog::getCreateTime, threshold)
        );
        log.info("清理登录日志完成，删除 {} 条30天前的记录", count);
    }

    /**
     * 清理30天前的任务执行日志
     */
    public void cleanJobLog() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(30);
        int count = jobLogMapper.delete(
                new LambdaQueryWrapper<SysJobLog>().lt(SysJobLog::getCreateTime, threshold)
        );
        log.info("清理任务日志完成，删除 {} 条30天前的记录", count);
    }

    /**
     * 清理当天的操作日志
     */
    public void cleanTodayOperLog() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        int count = logMapper.delete(
                new LambdaQueryWrapper<SysLog>().ge(SysLog::getCreateTime, startOfDay)
        );
        log.info("清理当天操作日志完成，删除 {} 条记录", count);
    }
}
