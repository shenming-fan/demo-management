package com.demo.admin.modules.system.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 登录日志实体
 */
@Data
@TableName("sys_login_log")
public class SysLoginLog implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 登录用户
     */
    private String username;

    /**
     * 登录状态：0-失败，1-成功
     */
    private Integer status;

    /**
     * IP地址
     */
    private String ip;

    /**
     * 提示消息
     */
    private String message;

    /**
     * 浏览器UA
     */
    private String userAgent;

    /**
     * 登录时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
