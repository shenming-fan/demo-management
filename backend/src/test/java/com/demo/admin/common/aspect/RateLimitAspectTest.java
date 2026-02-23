package com.demo.admin.common.aspect;

import com.demo.admin.common.annotation.RateLimit;
import com.demo.admin.common.exception.BusinessException;
import com.demo.admin.common.utils.RedisUtils;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RateLimitAspect 单元测试")
class RateLimitAspectTest {

    @InjectMocks
    private RateLimitAspect rateLimitAspect;

    @Mock
    private RedisUtils redisUtils;

    @Mock
    private ProceedingJoinPoint joinPoint;

    @Mock
    private MethodSignature methodSignature;

    @BeforeEach
    void setUp() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/test/action");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }

    // 辅助方法：模拟有 @RateLimit 注解的方法
    @RateLimit(count = 5, time = 60, message = "请求过于频繁，请稍后再试")
    public void mockAnnotatedMethod() {}

    private void setupMockMethod() throws NoSuchMethodException {
        Method method = this.getClass().getMethod("mockAnnotatedMethod");
        when(joinPoint.getSignature()).thenReturn(methodSignature);
        when(methodSignature.getMethod()).thenReturn(method);
    }

    @Test
    @DisplayName("限流内 - 允许通过")
    @SuppressWarnings("unchecked")
    void testWithinLimit_Allowed() throws Throwable {
        setupMockMethod();
        when(redisUtils.executeLuaScript(any(DefaultRedisScript.class), anyList(), any()))
                .thenReturn(3L);
        when(joinPoint.proceed()).thenReturn("success");

        Object result = rateLimitAspect.around(joinPoint);

        assertEquals("success", result);
        verify(redisUtils).executeLuaScript(any(DefaultRedisScript.class), anyList(), any());
    }

    @Test
    @DisplayName("超出限流 - 被拦截")
    @SuppressWarnings("unchecked")
    void testExceedLimit_Blocked() throws Throwable {
        setupMockMethod();
        // 返回6，超出限流次数5
        when(redisUtils.executeLuaScript(any(DefaultRedisScript.class), anyList(), any()))
                .thenReturn(6L);

        assertThrows(BusinessException.class, () ->
                rateLimitAspect.around(joinPoint));
        verify(joinPoint, never()).proceed();
    }
}
