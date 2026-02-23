package com.demo.admin.modules.tool.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.demo.admin.modules.tool.entity.GenTableColumn;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 代码生成 - 列信息 Mapper
 */
@Mapper
public interface GenTableColumnMapper extends BaseMapper<GenTableColumn> {

    /**
     * 根据表ID删除列信息
     */
    int deleteByTableId(@Param("tableId") Long tableId);
}
