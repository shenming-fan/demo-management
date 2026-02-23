package com.demo.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.admin.common.exception.BusinessException;
import com.demo.admin.common.result.ResultCode;
import com.demo.admin.modules.system.entity.SysUser;
import com.demo.admin.modules.system.mapper.SysUserMapper;
import com.demo.admin.modules.system.mapper.SysUserPostMapper;
import com.demo.admin.modules.system.mapper.SysUserRoleMapper;
import com.demo.admin.modules.system.service.SysUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 用户 Service 实现
 */
@Service
public class SysUserServiceImpl extends ServiceImpl<SysUserMapper, SysUser> implements SysUserService {

    @Autowired
    private SysUserRoleMapper userRoleMapper;

    @Autowired
    private SysUserPostMapper userPostMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public SysUser getByUsername(String username) {
        return baseMapper.selectByUsername(username);
    }

    @Override
    public List<String> getRoleCodesByUserId(Long userId) {
        return baseMapper.selectRoleCodesByUserId(userId);
    }

    @Override
    public List<String> getPermissionsByUserId(Long userId) {
        return baseMapper.selectPermissionsByUserId(userId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean createUser(SysUser user, List<Long> roleIds) {
        return createUser(user, roleIds, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean createUser(SysUser user, List<Long> roleIds, List<Long> postIds) {
        // 检查用户名是否存在
        SysUser existUser = getByUsername(user.getUsername());
        if (existUser != null) {
            throw new BusinessException(ResultCode.USER_EXISTS);
        }
        // 加密密码
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setStatus(1);
        user.setDeleted(0);
        // 校验角色不能为空
        if (roleIds == null || roleIds.isEmpty()) {
            throw new BusinessException(ResultCode.ROLE_IDS_REQUIRED);
        }
        boolean result = save(user);
        // 保存用户角色关联
        if (result) {
            userRoleMapper.batchInsert(user.getId(), roleIds);
        }
        // 保存用户岗位关联
        if (result && postIds != null && !postIds.isEmpty()) {
            userPostMapper.batchInsert(user.getId(), postIds);
        }
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean updateUser(SysUser user, List<Long> roleIds) {
        return updateUser(user, roleIds, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean updateUser(SysUser user, List<Long> roleIds, List<Long> postIds) {
        // 校验角色不能为空
        if (roleIds == null || roleIds.isEmpty()) {
            throw new BusinessException(ResultCode.ROLE_IDS_REQUIRED);
        }
        // 不更新密码
        user.setPassword(null);
        boolean result = updateById(user);
        // 更新用户角色关联
        if (result) {
            userRoleMapper.deleteByUserId(user.getId());
            userRoleMapper.batchInsert(user.getId(), roleIds);
        }
        // 更新用户岗位关联
        if (result) {
            userPostMapper.deleteByUserId(user.getId());
            if (postIds != null && !postIds.isEmpty()) {
                userPostMapper.batchInsert(user.getId(), postIds);
            }
        }
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean deleteUser(Long userId) {
        userRoleMapper.deleteByUserId(userId);
        userPostMapper.deleteByUserId(userId);
        return removeById(userId);
    }

    @Override
    public boolean resetPassword(Long userId, String newPassword) {
        SysUser user = new SysUser();
        user.setId(userId);
        user.setPassword(passwordEncoder.encode(newPassword));
        return updateById(user);
    }

    @Override
    public boolean updatePassword(Long userId, String oldPassword, String newPassword) {
        SysUser user = getById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new BusinessException(ResultCode.OLD_PASSWORD_ERROR);
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        return updateById(user);
    }
}
