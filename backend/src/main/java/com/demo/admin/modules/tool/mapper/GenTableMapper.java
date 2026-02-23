package com.demo.admin.modules.tool.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.demo.admin.modules.tool.entity.GenTable;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * 代码生成 - 表信息 Mapper
 */
@Mapper
public interface GenTableMapper extends BaseMapper<GenTable> {

    /**
     * 查询数据库中尚未导入的表列表
     */
    List<Map<String, Object>> selectDbTableList(@Param("tableName") String tableName);

    /**
     * 查询指定表的列信息（从 information_schema）
     */
    List<Map<String, Object>> selectDbColumnList(@Param("tableName") String tableName);
}
