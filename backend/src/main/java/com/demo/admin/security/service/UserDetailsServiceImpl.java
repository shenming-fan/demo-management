package com.demo.admin.security.service;

import com.demo.admin.common.exception.BusinessException;
import com.demo.admin.common.result.ResultCode;
import com.demo.admin.modules.system.entity.SysUser;
import com.demo.admin.modules.system.service.SysUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 用户详情服务实现
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private SysUserService userService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        SysUser user = userService.getByUsername(username);
        if (user == null) {
            throw new UsernameNotFoundException("用户不存在");
        }
        if (user.getStatus() == 0) {
            throw new BusinessException(ResultCode.USER_DISABLED);
        }
        // 获取用户角色和权限
        List<String> roles = userService.getRoleCodesByUserId(user.getId());
        List<String> permissions = userService.getPermissionsByUserId(user.getId());

        return new LoginUser(
                user.getId(),
                user.getDeptId(),
                user.getUsername(),
                user.getPassword(),
                user.getNickname(),
                user.getAvatar(),
                user.getStatus(),
                roles,
                permissions
        );
    }
}
