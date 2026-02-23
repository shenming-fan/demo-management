package com.demo.admin.modules.system.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.admin.modules.system.entity.SysUser;

import java.util.List;

/**
 * 用户 Service
 */
public interface SysUserService extends IService<SysUser> {

    /**
     * 根据用户名查询用户
     */
    SysUser getByUsername(String username);

    /**
     * 查询用户的角色编码列表
     */
    List<String> getRoleCodesByUserId(Long userId);

    /**
     * 查询用户的权限标识列表
     */
    List<String> getPermissionsByUserId(Long userId);

    /**
     * 创建用户
     */
    boolean createUser(SysUser user, List<Long> roleIds);

    /**
     * 创建用户（含岗位）
     */
    boolean createUser(SysUser user, List<Long> roleIds, List<Long> postIds);

    /**
     * 更新用户
     */
    boolean updateUser(SysUser user, List<Long> roleIds);

    /**
     * 更新用户（含岗位）
     */
    boolean updateUser(SysUser user, List<Long> roleIds, List<Long> postIds);

    /**
     * 删除用户
     */
    boolean deleteUser(Long userId);

    /**
     * 重置密码
     */
    boolean resetPassword(Long userId, String newPassword);

    /**
     * 修改密码
     */
    boolean updatePassword(Long userId, String oldPassword, String newPassword);
}
