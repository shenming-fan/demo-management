package com.demo.admin.modules.tool.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 代码生成 - 列信息
 */
@Data
@TableName("gen_table_column")
public class GenTableColumn implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 所属表ID */
    private Long tableId;

    /** 列名称 */
    private String columnName;

    /** 列描述 */
    private String columnComment;

    /** 列类型 */
    private String columnType;

    /** Java类型 */
    private String javaType;

    /** Java字段名 */
    private String javaField;

    /** TypeScript类型 */
    private String tsType;

    /** 是否主键 */
    private Integer isPk;

    /** 是否必填 */
    private Integer isRequired;

    /** 是否列表显示 */
    private Integer isList;

    /** 是否查询条件 */
    private Integer isQuery;

    /** 查询方式 */
    private String queryType;

    /** 是否编辑字段 */
    private Integer isEdit;

    /** 表单组件 */
    private String htmlType;

    /** 字典类型 */
    private String dictType;

    /** 排序 */
    private Integer sort;
}
