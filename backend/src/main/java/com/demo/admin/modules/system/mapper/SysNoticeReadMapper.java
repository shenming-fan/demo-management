package com.demo.admin.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.demo.admin.modules.system.entity.SysNoticeRead;
import org.apache.ibatis.annotations.Mapper;

/**
 * 公告已读记录 Mapper
 */
@Mapper
public interface SysNoticeReadMapper extends BaseMapper<SysNoticeRead> {
}
