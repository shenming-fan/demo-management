package com.demo.admin.common.aspect;

import com.demo.admin.common.annotation.DataScope;
import com.demo.admin.common.utils.DataScopeHelper;
import com.demo.admin.modules.system.service.SysDeptService;
import com.demo.admin.security.service.LoginUser;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 数据权限切面 - 设置当前用户可访问的部门ID列表到ThreadLocal
 */
@Aspect
@Component
public class DataScopeAspect {

    @Autowired
    private SysDeptService deptService;

    @Around("@annotation(dataScope)")
    public Object around(ProceedingJoinPoint point, DataScope dataScope) throws Throwable {
        try {
            if (!DataScopeHelper.isAdmin()) {
                LoginUser loginUser = DataScopeHelper.getLoginUser();
                if (loginUser != null && loginUser.getDeptId() != null) {
                    List<Long> deptIds = deptService.getChildDeptIds(loginUser.getDeptId());
                    DataScopeHelper.setDeptIds(deptIds);
                }
            }
            return point.proceed();
        } finally {
            DataScopeHelper.clear();
        }
    }
}
