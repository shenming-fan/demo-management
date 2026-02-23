package com.demo.admin.security.service;

import com.demo.admin.common.exception.BusinessException;
import com.demo.admin.modules.system.entity.SysUser;
import com.demo.admin.modules.system.service.SysUserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserDetailsServiceImpl 单元测试")
class UserDetailsServiceImplTest {

    @InjectMocks
    private UserDetailsServiceImpl userDetailsService;

    @Mock
    private SysUserService userService;

    @Test
    @DisplayName("加载用户 - 正常返回LoginUser")
    void testLoadUser_Success() {
        SysUser user = new SysUser();
        user.setId(1L);
        user.setDeptId(100L);
        user.setUsername("admin");
        user.setPassword("$2a$encoded");
        user.setNickname("管理员");
        user.setAvatar("/avatar.png");
        user.setStatus(1);

        when(userService.getByUsername("admin")).thenReturn(user);
        when(userService.getRoleCodesByUserId(1L)).thenReturn(Arrays.asList("admin", "user"));
        when(userService.getPermissionsByUserId(1L)).thenReturn(Arrays.asList("*:*:*"));

        UserDetails result = userDetailsService.loadUserByUsername("admin");

        assertNotNull(result);
        assertInstanceOf(LoginUser.class, result);
        LoginUser loginUser = (LoginUser) result;
        assertEquals(1L, loginUser.getUserId());
        assertEquals(100L, loginUser.getDeptId());
        assertEquals("admin", loginUser.getUsername());
        assertEquals("管理员", loginUser.getNickname());
        assertEquals(2, loginUser.getRoles().size());
        assertTrue(loginUser.getPermissions().contains("*:*:*"));
        assertTrue(loginUser.isEnabled());

        verify(userService).getByUsername("admin");
        verify(userService).getRoleCodesByUserId(1L);
        verify(userService).getPermissionsByUserId(1L);
    }

    @Test
    @DisplayName("加载用户 - 用户不存在抛UsernameNotFoundException")
    void testLoadUser_NotFound() {
        when(userService.getByUsername("nouser")).thenReturn(null);

        assertThrows(UsernameNotFoundException.class, () -> userDetailsService.loadUserByUsername("nouser"));

        verify(userService).getByUsername("nouser");
        verify(userService, never()).getRoleCodesByUserId(anyLong());
    }

    @Test
    @DisplayName("加载用户 - 用户被禁用抛BusinessException")
    void testLoadUser_Disabled() {
        SysUser user = new SysUser();
        user.setId(2L);
        user.setUsername("disabled_user");
        user.setStatus(0); // 禁用

        when(userService.getByUsername("disabled_user")).thenReturn(user);

        assertThrows(BusinessException.class, () -> userDetailsService.loadUserByUsername("disabled_user"));

        verify(userService).getByUsername("disabled_user");
        verify(userService, never()).getRoleCodesByUserId(anyLong());
    }

    @Test
    @DisplayName("加载用户 - 无角色无权限")
    void testLoadUser_NoRolesNoPermissions() {
        SysUser user = new SysUser();
        user.setId(3L);
        user.setDeptId(200L);
        user.setUsername("basic_user");
        user.setPassword("$2a$encoded");
        user.setNickname("普通用户");
        user.setStatus(1);

        when(userService.getByUsername("basic_user")).thenReturn(user);
        when(userService.getRoleCodesByUserId(3L)).thenReturn(Collections.emptyList());
        when(userService.getPermissionsByUserId(3L)).thenReturn(Collections.emptyList());

        UserDetails result = userDetailsService.loadUserByUsername("basic_user");

        LoginUser loginUser = (LoginUser) result;
        assertTrue(loginUser.getRoles().isEmpty());
        assertTrue(loginUser.getPermissions().isEmpty());
        assertTrue(loginUser.getAuthorities().isEmpty());
    }
}
