package com.demo.admin.modules.system.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 定时任务实体
 */
@Data
@TableName("sys_job")
public class SysJob implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 任务名称 */
    private String jobName;

    /** 任务组名 */
    private String jobGroup;

    /** Cron表达式 */
    private String cronExpression;

    /** 调用目标Bean */
    private String beanName;

    /** 调用方法名 */
    private String methodName;

    /** 方法参数 */
    private String params;

    /** 状态：0-暂停，1-运行 */
    private Integer status;

    /** 备注 */
    private String remark;

    /** 创建时间 */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /** 更新时间 */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    /** 删除标志 */
    @TableLogic
    private Integer deleted;
}
