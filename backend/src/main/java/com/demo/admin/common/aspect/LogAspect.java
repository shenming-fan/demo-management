package com.demo.admin.common.aspect;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.demo.admin.common.annotation.OperLog;
import com.demo.admin.modules.system.entity.SysLog;
import com.demo.admin.modules.system.mapper.SysLogMapper;
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
import java.lang.reflect.Field;
import java.lang.reflect.Method;

/**
 * 操作日志切面
 */
@Aspect
@Component
public class LogAspect {

    @Autowired
    private SysLogMapper logMapper;

    @Around("@annotation(com.demo.admin.common.annotation.OperLog)")
    public Object around(ProceedingJoinPoint point) throws Throwable {
        long startTime = System.currentTimeMillis();
        Object result = null;
        Throwable ex = null;

        // 尝试获取变更前数据（仅对修改操作）
        String oldValue = null;
        try {
            oldValue = captureOldValue(point);
        } catch (Exception e) {
            // ignore
        }

        try {
            result = point.proceed();
        } catch (Throwable throwable) {
            ex = throwable;
            throw throwable;
        } finally {
            long elapsed = System.currentTimeMillis() - startTime;
            try {
                saveLog(point, elapsed, ex, result, oldValue);
            } catch (Exception e) {
                // 日志记录失败不影响业务
            }
        }

        return result;
    }

    /**
     * 对修改操作，在执行前捕获旧数据
     */
    private String captureOldValue(ProceedingJoinPoint point) {
        // 判断是否为PUT请求（修改操作）
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) return null;
        HttpServletRequest request = attrs.getRequest();
        if (!"PUT".equalsIgnoreCase(request.getMethod())) return null;

        // 从请求参数中获取ID
        Object[] args = point.getArgs();
        if (args == null || args.length == 0) return null;

        Object entity = args[0];
        if (entity == null) return null;

        Long entityId = extractId(entity);
        if (entityId == null) return null;

        // 在Controller中查找BaseMapper类型的字段，用它来查询旧数据
        Object target = point.getTarget();
        BaseMapper mapper = findMapper(target);
        if (mapper == null) return null;

        Object oldEntity = mapper.selectById(entityId);
        if (oldEntity == null) return null;

        String json = JSONUtil.toJsonStr(oldEntity);
        return json.length() > 5000 ? json.substring(0, 5000) : json;
    }

    /**
     * 从实体对象中提取ID字段值
     */
    private Long extractId(Object entity) {
        try {
            // 先尝试JSON方式获取
            if (entity instanceof java.util.Map) {
                Object id = ((java.util.Map<?, ?>) entity).get("id");
                if (id != null) return Long.valueOf(id.toString());
            }

            // 反射获取id字段
            Field idField = null;
            Class<?> clazz = entity.getClass();
            while (clazz != null) {
                try {
                    idField = clazz.getDeclaredField("id");
                    break;
                } catch (NoSuchFieldException e) {
                    clazz = clazz.getSuperclass();
                }
            }
            if (idField != null) {
                idField.setAccessible(true);
                Object val = idField.get(entity);
                if (val != null) return Long.valueOf(val.toString());
            }
        } catch (Exception e) {
            // ignore
        }
        return null;
    }

    /**
     * 在Controller中查找BaseMapper或IService的实例
     */
    @SuppressWarnings("rawtypes")
    private BaseMapper findMapper(Object target) {
        Class<?> clazz = target.getClass();
        // 可能是CGLIB代理类
        if (clazz.getName().contains("$$")) {
            clazz = clazz.getSuperclass();
        }
        for (Field field : clazz.getDeclaredFields()) {
            field.setAccessible(true);
            try {
                Object val = field.get(target);
                if (val instanceof BaseMapper) {
                    return (BaseMapper) val;
                }
            } catch (Exception e) {
                // ignore
            }
        }
        return null;
    }

    private void saveLog(ProceedingJoinPoint point, long elapsed, Throwable ex, Object result, String oldValue) {
        MethodSignature signature = (MethodSignature) point.getSignature();
        Method method = signature.getMethod();
        OperLog operLog = method.getAnnotation(OperLog.class);

        SysLog log = new SysLog();

        // 操作描述
        if (operLog != null && StrUtil.isNotBlank(operLog.value())) {
            log.setOperation(operLog.value());
        }

        // 请求方法（类名.方法名）
        String className = point.getTarget().getClass().getName();
        String methodName = method.getName();
        log.setMethod(className + "." + methodName + "()");

        // 请求参数（截断过长参数）
        String newValue = null;
        try {
            Object[] args = point.getArgs();
            if (args != null && args.length > 0) {
                String params = JSONUtil.toJsonStr(args);
                log.setParams(params.length() > 2000 ? params.substring(0, 2000) : params);

                // 对修改操作，记录新值
                if (oldValue != null) {
                    newValue = JSONUtil.toJsonStr(args[0]);
                    if (newValue.length() > 5000) newValue = newValue.substring(0, 5000);
                }
            }
        } catch (Exception e) {
            log.setParams("参数序列化失败");
        }

        // 变更前后数据
        log.setOldValue(oldValue);
        log.setNewValue(newValue);

        // 执行时长
        log.setTime(elapsed);

        // 当前用户
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof LoginUser) {
                LoginUser loginUser = (LoginUser) auth.getPrincipal();
                log.setUsername(loginUser.getUsername());
            }
        } catch (Exception e) {
            // ignore
        }

        // IP 地址
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                String ip = request.getHeader("X-Forwarded-For");
                if (StrUtil.isBlank(ip) || "unknown".equalsIgnoreCase(ip)) {
                    ip = request.getHeader("X-Real-IP");
                }
                if (StrUtil.isBlank(ip) || "unknown".equalsIgnoreCase(ip)) {
                    ip = request.getRemoteAddr();
                }
                // 多代理时取第一个
                if (ip != null && ip.contains(",")) {
                    ip = ip.split(",")[0].trim();
                }
                log.setIp(ip);
            }
        } catch (Exception e) {
            // ignore
        }

        // 操作状态
        if (ex != null) {
            log.setStatus(0);
            String errMsg = ex.getMessage();
            log.setErrorMsg(errMsg != null && errMsg.length() > 2000 ? errMsg.substring(0, 2000) : errMsg);
        } else {
            log.setStatus(1);
        }

        // 响应结果
        if (result != null) {
            try {
                String resBody = JSONUtil.toJsonStr(result);
                log.setResponseBody(resBody.length() > 2000 ? resBody.substring(0, 2000) : resBody);
            } catch (Exception e) {
                // ignore
            }
        }

        logMapper.insert(log);
    }
}
