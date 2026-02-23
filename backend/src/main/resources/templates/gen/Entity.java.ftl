package ${packageName}.modules.${moduleName}.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
<#list importTypes as type>
import ${type};
</#list>

/**
 * ${functionName}实体
 *
 * @author ${author}
 * @date ${date}
 */
@Data
@TableName("${tableName}")
public class ${className} implements Serializable {

    private static final long serialVersionUID = 1L;
<#list columns as col>

    <#if col.columnComment?? && col.columnComment != ''>
    /** ${col.columnComment} */
    </#if>
    <#if col.isPk == 1>
    @TableId(type = IdType.AUTO)
    </#if>
    <#if col.javaField == 'createTime'>
    @TableField(fill = FieldFill.INSERT)
    </#if>
    <#if col.javaField == 'updateTime'>
    @TableField(fill = FieldFill.INSERT_UPDATE)
    </#if>
    <#if col.javaField == 'deleted'>
    @TableLogic
    </#if>
    private ${col.javaType} ${col.javaField};
</#list>
}
