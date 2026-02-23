package com.demo.admin.modules.system.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 定时任务日志实体
 */
@Data
@TableName("sys_job_log")
public class SysJobLog implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 任务ID */
    private Long jobId;

    /** 任务名称 */
    private String jobName;

    /** 调用目标 */
    private String beanName;

    /** 调用方法 */
    private String methodName;

    /** 方法参数 */
    private String params;

    /** 执行状态：0-失败，1-成功 */
    private Integer status;

    /** 执行信息 */
    private String message;

    /** 执行时长(毫秒) */
    private Long duration;

    /** 执行时间 */
    private LocalDateTime createTime;
}
