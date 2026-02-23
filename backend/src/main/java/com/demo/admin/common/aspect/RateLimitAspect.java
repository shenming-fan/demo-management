package com.demo.admin.common.aspect;

import com.demo.admin.common.annotation.RateLimit;
import com.demo.admin.common.exception.BusinessException;
import com.demo.admin.common.utils.RedisUtils;
import com.demo.admin.security.service.LoginUser;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.lang.reflect.Method;
import java.util.Collections;

/**
 * 接口限流切面
 */
@Aspect
@Component
public class RateLimitAspect {

    /** Lua脚本：原子的 incr + 首次设置expire */
    private static final String RATE_LIMIT_LUA =
            "local c = redis.call('incr', KEYS[1]); " +
            "if c == 1 then redis.call('expire', KEYS[1], ARGV[1]) end; " +
            "return c;";

    private static final DefaultRedisScript<Long> RATE_LIMIT_SCRIPT;

    static {
        RATE_LIMIT_SCRIPT = new DefaultRedisScript<>();
        RATE_LIMIT_SCRIPT.setScriptText(RATE_LIMIT_LUA);
        RATE_LIMIT_SCRIPT.setResultType(Long.class);
    }

    @Autowired
    private RedisUtils redisUtils;

    @Around("@annotation(com.demo.admin.common.annotation.RateLimit)")
    public Object around(ProceedingJoinPoint point) throws Throwable {
        MethodSignature signature = (MethodSignature) point.getSignature();
        Method method = signature.getMethod();
        RateLimit annotation = method.getAnnotation(RateLimit.class);

        String key = buildKey(point);
        // 使用 Lua 脚本原子执行 incr + expire
        Long count = redisUtils.executeLuaScript(RATE_LIMIT_SCRIPT,
                Collections.singletonList(key), annotation.time());
        if (count != null && count > annotation.count()) {
            throw new BusinessException(annotation.message());
        }

        return point.proceed();
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

        String uri = "";
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                uri = request.getRequestURI();
            }
        } catch (Exception e) {
            // ignore
        }

        return "rate_limit:" + userKey + ":" + uri;
    }
}
