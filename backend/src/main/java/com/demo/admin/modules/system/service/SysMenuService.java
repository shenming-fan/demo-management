package com.demo.admin.modules.system.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.admin.modules.system.entity.SysMenu;

import java.util.List;

/**
 * 菜单 Service
 */
public interface SysMenuService extends IService<SysMenu> {

    /**
     * 根据用户ID查询菜单列表
     */
    List<SysMenu> getMenusByUserId(Long userId);

    /**
     * 根据角色ID查询菜单ID列表
     */
    List<Long> getMenuIdsByRoleId(Long roleId);

    /**
     * 构建菜单树
     */
    List<SysMenu> buildMenuTree(List<SysMenu> menus);

    /**
     * 获取所有菜单列表
     */
    List<SysMenu> listAll();
}
