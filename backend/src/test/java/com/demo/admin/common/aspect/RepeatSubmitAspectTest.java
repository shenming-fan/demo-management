package com.demo.admin.common.aspect;

import com.demo.admin.common.annotation.RepeatSubmit;
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
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RepeatSubmitAspect 单元测试")
class RepeatSubmitAspectTest {

    @InjectMocks
    private RepeatSubmitAspect repeatSubmitAspect;

    @Mock
    private RedisUtils redisUtils;

    @Mock
    private ProceedingJoinPoint joinPoint;

    @Mock
    private MethodSignature methodSignature;

    @BeforeEach
    void setUp() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/test/submit");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }

    // 辅助方法：模拟有 @RepeatSubmit 注解的方法
    @RepeatSubmit(interval = 3, message = "请勿重复提交")
    public void mockAnnotatedMethod() {}

    private void setupMockMethod() throws NoSuchMethodException {
        Method method = this.getClass().getMethod("mockAnnotatedMethod");
        when(joinPoint.getSignature()).thenReturn(methodSignature);
        when(methodSignature.getMethod()).thenReturn(method);
    }

    @Test
    @DisplayName("首次提交 - 允许通过")
    void testFirstSubmit_Allowed() throws Throwable {
        setupMockMethod();
        when(redisUtils.setIfAbsent(anyString(), eq("1"), eq(3L), eq(TimeUnit.SECONDS)))
                .thenReturn(true);
        when(joinPoint.proceed()).thenReturn("success");

        Object result = repeatSubmitAspect.around(joinPoint);

        assertEquals("success", result);
        verify(redisUtils).setIfAbsent(anyString(), eq("1"), eq(3L), eq(TimeUnit.SECONDS));
    }

    @Test
    @DisplayName("重复提交 - 被拦截")
    void testRepeatSubmit_Blocked() throws Throwable {
        setupMockMethod();
        // setIfAbsent 返回 false，说明 key 已存在
        when(redisUtils.setIfAbsent(anyString(), eq("1"), eq(3L), eq(TimeUnit.SECONDS)))
                .thenReturn(false);

        assertThrows(BusinessException.class, () ->
                repeatSubmitAspect.around(joinPoint));
        verify(joinPoint, never()).proceed();
    }
}
