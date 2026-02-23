package com.demo.admin.modules.tool.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.demo.admin.modules.tool.entity.GenTable;
import com.demo.admin.modules.tool.entity.GenTableColumn;

import java.util.List;
import java.util.Map;

/**
 * 代码生成 Service
 */
public interface GenService {

    /**
     * 分页查询已导入的表
     */
    IPage<GenTable> page(IPage<GenTable> page, String tableName);

    /**
     * 查询数据库中可导入的表
     */
    List<Map<String, Object>> selectDbTableList(String tableName);

    /**
     * 导入表
     */
    void importTables(List<String> tableNames);

    /**
     * 查询表详情（含列信息）
     */
    GenTable getTableWithColumns(Long tableId);

    /**
     * 更新表及列配置
     */
    void updateGenTable(GenTable table);

    /**
     * 删除已导入的表
     */
    void deleteTable(Long tableId);

    /**
     * 预览代码
     */
    Map<String, String> previewCode(Long tableId);

    /**
     * 下载代码（ZIP 字节流）
     */
    byte[] downloadCode(Long tableId);
}
