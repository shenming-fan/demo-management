package com.demo.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.admin.common.exception.BusinessException;
import com.demo.admin.common.result.ResultCode;
import com.demo.admin.modules.system.entity.SysRole;
import com.demo.admin.modules.system.mapper.SysRoleMapper;
import com.demo.admin.modules.system.mapper.SysRoleMenuMapper;
import com.demo.admin.modules.system.mapper.SysUserRoleMapper;
import com.demo.admin.modules.system.service.SysRoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 角色 Service 实现
 */
@Service
public class SysRoleServiceImpl extends ServiceImpl<SysRoleMapper, SysRole> implements SysRoleService {

    @Autowired
    private SysRoleMenuMapper roleMenuMapper;

    @Autowired
    private SysUserRoleMapper userRoleMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean createRole(SysRole role, List<Long> menuIds) {
        role.setStatus(1);
        role.setDeleted(0);
        boolean result = save(role);
        if (result && menuIds != null && !menuIds.isEmpty()) {
            roleMenuMapper.batchInsert(role.getId(), menuIds);
        }
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean updateRole(SysRole role, List<Long> menuIds) {
        boolean result = updateById(role);
        if (result && menuIds != null) {
            roleMenuMapper.deleteByRoleId(role.getId());
            if (!menuIds.isEmpty()) {
                roleMenuMapper.batchInsert(role.getId(), menuIds);
            }
        }
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean deleteRole(Long roleId) {
        // 检查是否有用户绑定该角色
        int userCount = userRoleMapper.countByRoleId(roleId);
        if (userCount > 0) {
            throw new BusinessException(ResultCode.ROLE_HAS_USERS);
        }
        roleMenuMapper.deleteByRoleId(roleId);
        return removeById(roleId);
    }

    @Override
    public List<SysRole> listEnabled() {
        return list(new LambdaQueryWrapper<SysRole>()
                .eq(SysRole::getStatus, 1)
                .orderByAsc(SysRole::getSort));
    }
}
