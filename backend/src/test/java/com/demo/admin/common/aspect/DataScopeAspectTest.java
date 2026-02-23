package com.demo.admin.common.aspect;

import com.demo.admin.common.annotation.DataScope;
import com.demo.admin.common.utils.DataScopeHelper;
import com.demo.admin.modules.system.service.SysDeptService;
import com.demo.admin.security.service.LoginUser;
import org.aspectj.lang.ProceedingJoinPoint;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DataScopeAspect 单元测试")
class DataScopeAspectTest {

    @InjectMocks
    private DataScopeAspect dataScopeAspect;

    @Mock
    private SysDeptService deptService;

    @Mock
    private ProceedingJoinPoint joinPoint;

    @Mock
    private DataScope dataScope;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        DataScopeHelper.clear();
    }

    private void setCurrentUser(LoginUser loginUser) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(loginUser, null,
                loginUser.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("普通用户 - 设置部门ID到ThreadLocal")
    void testNormalUser_SetsDeptIds() throws Throwable {
        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(2L);
        loginUser.setDeptId(100L);
        loginUser.setUsername("user");
        loginUser.setStatus(1);
        loginUser.setPermissions(Arrays.asList("system:user:list"));
        setCurrentUser(loginUser);

        List<Long> expectedDeptIds = Arrays.asList(100L, 101L, 102L);
        when(deptService.getChildDeptIds(100L)).thenReturn(expectedDeptIds);
        when(joinPoint.proceed()).thenAnswer(invocation -> {
            // 在方法执行期间，ThreadLocal 中应该有部门ID
            List<Long> deptIds = DataScopeHelper.getDeptIds();
            assertNotNull(deptIds);
            assertEquals(3, deptIds.size());
            assertTrue(deptIds.contains(100L));
            return "success";
        });

        Object result = dataScopeAspect.around(joinPoint, dataScope);

        assertEquals("success", result);
        verify(deptService).getChildDeptIds(100L);
        // 执行后 ThreadLocal 应该已被清理
        assertNull(DataScopeHelper.getDeptIds());
    }

    @Test
    @DisplayName("admin用户 - 跳过部门过滤")
    void testAdminUser_SkipsFilter() throws Throwable {
        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(1L);
        loginUser.setDeptId(100L);
        loginUser.setUsername("admin");
        loginUser.setStatus(1);
        loginUser.setPermissions(Arrays.asList("*:*:*"));
        setCurrentUser(loginUser);

        when(joinPoint.proceed()).thenReturn("success");

        Object result = dataScopeAspect.around(joinPoint, dataScope);

        assertEquals("success", result);
        // admin 不应该查询部门
        verify(deptService, never()).getChildDeptIds(anyLong());
        // ThreadLocal 中不应设置任何值
        assertNull(DataScopeHelper.getDeptIds());
    }

    @Test
    @DisplayName("方法抛异常 - ThreadLocal仍被清理（finally保证）")
    void testException_ThreadLocalCleared() throws Throwable {
        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(3L);
        loginUser.setDeptId(200L);
        loginUser.setUsername("user2");
        loginUser.setStatus(1);
        loginUser.setPermissions(Arrays.asList("system:user:list"));
        setCurrentUser(loginUser);

        when(deptService.getChildDeptIds(200L)).thenReturn(Arrays.asList(200L));
        when(joinPoint.proceed()).thenThrow(new RuntimeException("业务异常"));

        assertThrows(RuntimeException.class, () -> dataScopeAspect.around(joinPoint, dataScope));

        // 即使抛异常，ThreadLocal 也必须清理
        assertNull(DataScopeHelper.getDeptIds());
    }

    @Test
    @DisplayName("用户无部门ID - 不设置ThreadLocal")
    void testNoDeptId_NoThreadLocal() throws Throwable {
        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(4L);
        loginUser.setDeptId(null); // 无部门
        loginUser.setUsername("user3");
        loginUser.setStatus(1);
        loginUser.setPermissions(Arrays.asList("system:user:list"));
        setCurrentUser(loginUser);

        when(joinPoint.proceed()).thenReturn("success");

        Object result = dataScopeAspect.around(joinPoint, dataScope);

        assertEquals("success", result);
        verify(deptService, never()).getChildDeptIds(anyLong());
        assertNull(DataScopeHelper.getDeptIds());
    }
}
