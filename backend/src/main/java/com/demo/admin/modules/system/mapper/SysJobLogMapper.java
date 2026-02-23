package com.demo.admin.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.demo.admin.modules.system.entity.SysJobLog;
import org.apache.ibatis.annotations.Mapper;

/**
 * 定时任务日志 Mapper
 */
@Mapper
public interface SysJobLogMapper extends BaseMapper<SysJobLog> {
}
