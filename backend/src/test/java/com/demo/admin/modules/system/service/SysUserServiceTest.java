package com.demo.admin.modules.system.service;

import com.demo.admin.common.exception.BusinessException;
import com.demo.admin.modules.system.entity.SysUser;
import com.demo.admin.modules.system.mapper.SysUserMapper;
import com.demo.admin.modules.system.mapper.SysUserPostMapper;
import com.demo.admin.modules.system.mapper.SysUserRoleMapper;
import com.demo.admin.modules.system.service.impl.SysUserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SysUserService 单元测试")
class SysUserServiceTest {

    @Spy
    @InjectMocks
    private SysUserServiceImpl userService;

    @Mock
    private SysUserMapper baseMapper; // 必须叫 baseMapper，匹配 ServiceImpl 的字段名

    @Mock
    private SysUserRoleMapper userRoleMapper;

    @Mock
    private SysUserPostMapper userPostMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    private SysUser testUser;

    @BeforeEach
    void setUp() {
        testUser = new SysUser();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setPassword("password123");
        testUser.setNickname("测试用户");
        testUser.setStatus(1);
        testUser.setDeleted(0);
    }

    @Test
    @DisplayName("根据用户名查询 - 用户存在")
    void testGetByUsername_Found() {
        when(baseMapper.selectByUsername("testuser")).thenReturn(testUser);

        SysUser result = userService.getByUsername("testuser");

        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        verify(baseMapper).selectByUsername("testuser");
    }

    @Test
    @DisplayName("根据用户名查询 - 用户不存在")
    void testGetByUsername_NotFound() {
        when(baseMapper.selectByUsername("nouser")).thenReturn(null);

        SysUser result = userService.getByUsername("nouser");

        assertNull(result);
        verify(baseMapper).selectByUsername("nouser");
    }

    @Test
    @DisplayName("创建用户 - 成功")
    void testCreateUser_Success() {
        List<Long> roleIds = Arrays.asList(1L, 2L);
        List<Long> postIds = Arrays.asList(1L);

        when(baseMapper.selectByUsername("testuser")).thenReturn(null);
        when(passwordEncoder.encode("password123")).thenReturn("$2a$encoded");
        when(baseMapper.insert(any(SysUser.class))).thenReturn(1);
        when(userRoleMapper.batchInsert(any(), eq(roleIds))).thenReturn(2);
        when(userPostMapper.batchInsert(any(), eq(postIds))).thenReturn(1);

        boolean result = userService.createUser(testUser, roleIds, postIds);

        assertTrue(result);
        assertEquals("$2a$encoded", testUser.getPassword());
        assertEquals(1, testUser.getStatus());
        assertEquals(0, testUser.getDeleted());
        verify(passwordEncoder).encode("password123");
        verify(userRoleMapper).batchInsert(any(), eq(roleIds));
        verify(userPostMapper).batchInsert(any(), eq(postIds));
    }

    @Test
    @DisplayName("创建用户 - 用户名重复")
    void testCreateUser_DuplicateUsername() {
        when(baseMapper.selectByUsername("testuser")).thenReturn(testUser);

        List<Long> roleIds = Arrays.asList(1L);
        assertThrows(BusinessException.class, () ->
                userService.createUser(testUser, roleIds, null));
    }

    @Test
    @DisplayName("创建用户 - 角色为空")
    void testCreateUser_EmptyRoles() {
        when(baseMapper.selectByUsername("testuser")).thenReturn(null);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$encoded");

        assertThrows(BusinessException.class, () ->
                userService.createUser(testUser, Collections.emptyList(), null));
    }

    @Test
    @DisplayName("更新用户 - 成功")
    void testUpdateUser_Success() {
        List<Long> roleIds = Arrays.asList(1L, 3L);
        List<Long> postIds = Arrays.asList(2L);

        when(baseMapper.updateById(any(SysUser.class))).thenReturn(1);
        when(userRoleMapper.deleteByUserId(1L)).thenReturn(2);
        when(userRoleMapper.batchInsert(1L, roleIds)).thenReturn(2);
        when(userPostMapper.deleteByUserId(1L)).thenReturn(1);
        when(userPostMapper.batchInsert(1L, postIds)).thenReturn(1);

        boolean result = userService.updateUser(testUser, roleIds, postIds);

        assertTrue(result);
        assertNull(testUser.getPassword()); // 不更新密码
        verify(userRoleMapper).deleteByUserId(1L);
        verify(userRoleMapper).batchInsert(1L, roleIds);
        verify(userPostMapper).deleteByUserId(1L);
        verify(userPostMapper).batchInsert(1L, postIds);
    }

    @Test
    @DisplayName("删除用户 - 成功")
    void testDeleteUser_Success() {
        when(userRoleMapper.deleteByUserId(1L)).thenReturn(1);
        when(userPostMapper.deleteByUserId(1L)).thenReturn(1);
        // removeById 内部依赖 MyBatis-Plus TableInfo，用 doReturn 绕过
        doReturn(true).when(userService).removeById(1L);

        boolean result = userService.deleteUser(1L);

        assertTrue(result);
        verify(userRoleMapper).deleteByUserId(1L);
        verify(userPostMapper).deleteByUserId(1L);
    }

    @Test
    @DisplayName("重置密码")
    void testResetPassword() {
        when(passwordEncoder.encode("newpass")).thenReturn("$2a$newencoded");
        when(baseMapper.updateById(any(SysUser.class))).thenReturn(1);

        boolean result = userService.resetPassword(1L, "newpass");

        assertTrue(result);
        verify(passwordEncoder).encode("newpass");
    }

    @Test
    @DisplayName("修改密码 - 成功")
    void testUpdatePassword_Success() {
        SysUser dbUser = new SysUser();
        dbUser.setId(1L);
        dbUser.setPassword("$2a$oldencoded");

        when(baseMapper.selectById(1L)).thenReturn(dbUser);
        when(passwordEncoder.matches("oldpass", "$2a$oldencoded")).thenReturn(true);
        when(passwordEncoder.encode("newpass")).thenReturn("$2a$newencoded");
        when(baseMapper.updateById(any(SysUser.class))).thenReturn(1);

        boolean result = userService.updatePassword(1L, "oldpass", "newpass");

        assertTrue(result);
        verify(passwordEncoder).matches("oldpass", "$2a$oldencoded");
        verify(passwordEncoder).encode("newpass");
    }

    @Test
    @DisplayName("修改密码 - 旧密码错误")
    void testUpdatePassword_WrongOld() {
        SysUser dbUser = new SysUser();
        dbUser.setId(1L);
        dbUser.setPassword("$2a$oldencoded");

        when(baseMapper.selectById(1L)).thenReturn(dbUser);
        when(passwordEncoder.matches("wrongpass", "$2a$oldencoded")).thenReturn(false);

        assertThrows(BusinessException.class, () ->
                userService.updatePassword(1L, "wrongpass", "newpass"));
    }
}
