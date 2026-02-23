package com.demo.admin.modules.tool.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 代码生成 - 表信息
 */
@Data
@TableName("gen_table")
public class GenTable implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 表名称 */
    private String tableName;

    /** 表描述 */
    private String tableComment;

    /** 实体类名 */
    private String className;

    /** 生成包路径 */
    private String packageName;

    /** 模块名 */
    private String moduleName;

    /** 业务名 */
    private String businessName;

    /** 功能名称 */
    private String functionName;

    /** 作者 */
    private String author;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    /** 列信息（非数据库字段） */
    @TableField(exist = false)
    private List<GenTableColumn> columns;
}
