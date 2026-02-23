package com.demo.admin.modules.system.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 菜单实体
 */
@Data
@TableName("sys_menu")
public class SysMenu implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 父级ID
     */
    private Long parentId;

    /**
     * 菜单名称
     */
    private String name;

    /**
     * 菜单类型：1-目录，2-菜单，3-按钮
     */
    private Integer type;

    /**
     * 路由路径
     */
    private String path;

    /**
     * 组件路径
     */
    private String component;

    /**
     * 权限标识
     */
    private String permission;

    /**
     * 图标
     */
    private String icon;

    /**
     * 排序
     */
    private Integer sort;

    /**
     * 是否可见：0-隐藏，1-显示
     */
    private Integer visible;

    /**
     * 状态：0-禁用，1-正常
     */
    private Integer status;

    /**
     * 是否外链：0-否，1-是
     */
    private Integer isFrame;

    /**
     * 是否缓存：0-否，1-是
     */
    private Integer isCache;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;

    /**
     * 子菜单列表
     */
    @TableField(exist = false)
    private List<SysMenu> children;
}
