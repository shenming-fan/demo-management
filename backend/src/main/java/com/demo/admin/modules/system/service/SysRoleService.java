package com.demo.admin.modules.system.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.admin.modules.system.entity.SysRole;

import java.util.List;

/**
 * 角色 Service
 */
public interface SysRoleService extends IService<SysRole> {

    /**
     * 创建角色
     */
    boolean createRole(SysRole role, List<Long> menuIds);

    /**
     * 更新角色
     */
    boolean updateRole(SysRole role, List<Long> menuIds);

    /**
     * 删除角色
     */
    boolean deleteRole(Long roleId);

    /**
     * 获取所有启用的角色
     */
    List<SysRole> listEnabled();
}
