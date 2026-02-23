package com.demo.admin.common.utils;

import com.demo.admin.security.service.LoginUser;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.ArrayList;
import java.util.List;

/**
 * 数据权限辅助工具 - ThreadLocal传递可访问的部门ID列表
 */
public class DataScopeHelper {

    private static final ThreadLocal<List<Long>> DEPT_IDS = new ThreadLocal<>();

    public static void setDeptIds(List<Long> deptIds) {
        DEPT_IDS.set(deptIds);
    }

    public static List<Long> getDeptIds() {
        return DEPT_IDS.get();
    }

    public static void clear() {
        DEPT_IDS.remove();
    }

    /**
     * 获取当前登录用户
     */
    public static LoginUser getLoginUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof LoginUser) {
                return (LoginUser) auth.getPrincipal();
            }
        } catch (Exception e) {
            // ignore
        }
        return null;
    }

    /**
     * 判断当前用户是否是超级管理员
     */
    public static boolean isAdmin() {
        LoginUser user = getLoginUser();
        if (user == null) return false;
        return user.getPermissions() != null && user.getPermissions().contains("*:*:*");
    }
}
