package com.demo.admin.common.aspect;

import com.demo.admin.common.annotation.RepeatSubmit;
import com.demo.admin.common.exception.BusinessException;
import com.demo.admin.common.utils.RedisUtils;
import com.demo.admin.security.service.LoginUser;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.lang.reflect.Method;
import java.util.concurrent.TimeUnit;

/**
 * 防重复提交切面
 */
@Aspect
@Component
public class RepeatSubmitAspect {

    @Autowired
    private RedisUtils redisUtils;

    @Around("@annotation(com.demo.admin.common.annotation.RepeatSubmit)")
    public Object around(ProceedingJoinPoint point) throws Throwable {
        MethodSignature signature = (MethodSignature) point.getSignature();
        Method method = signature.getMethod();
        RepeatSubmit annotation = method.getAnnotation(RepeatSubmit.class);

        String key = buildKey(point);
        // 原子操作：SETNX + EX，避免 hasKey + set 之间的竞态条件
        Boolean absent = redisUtils.setIfAbsent(key, "1", annotation.interval(), TimeUnit.SECONDS);
        if (Boolean.FALSE.equals(absent)) {
            throw new BusinessException(annotation.message());
        }
        try {
            return point.proceed();
        } catch (Throwable throwable) {
            redisUtils.delete(key);
            throw throwable;
        }
    }

    private String buildKey(ProceedingJoinPoint point) {
        String userKey = "anonymous";
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof LoginUser) {
                userKey = ((LoginUser) auth.getPrincipal()).getUsername();
            }
        } catch (Exception e) {
            // ignore
        }

        String requestUri = "";
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                requestUri = request.getRequestURI();
            }
        } catch (Exception e) {
            // ignore
        }

        return "repeat_submit:" + userKey + ":" + requestUri;
    }
}
