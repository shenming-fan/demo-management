package com.demo.admin.security.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * 自定义权限校验服务，支持超级管理员角色和通配权限
 */
@Service("ss")
public class PermissionService {

    private static final String SUPER_ADMIN_ROLE = "admin";
    private static final String ALL_PERMISSION = "*:*:*";

    /**
     * 判断当前用户是否拥有指定权限
     */
    public boolean hasPermi(String permission) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof LoginUser)) {
            return false;
        }
        LoginUser loginUser = (LoginUser) principal;

        // 超级管理员角色拥有所有权限
        if (loginUser.getRoles().contains(SUPER_ADMIN_ROLE)) {
            return true;
        }

        // 检查通配权限或精确匹配
        for (String perm : loginUser.getPermissions()) {
            if (ALL_PERMISSION.equals(perm) || perm.equals(permission)) {
                return true;
            }
        }
        return false;
    }
}
