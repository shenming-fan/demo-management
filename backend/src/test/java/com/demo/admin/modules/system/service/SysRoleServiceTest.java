package com.demo.admin.modules.system.service;

import com.demo.admin.common.exception.BusinessException;
import com.demo.admin.modules.system.entity.SysRole;
import com.demo.admin.modules.system.mapper.SysRoleMapper;
import com.demo.admin.modules.system.mapper.SysRoleMenuMapper;
import com.demo.admin.modules.system.mapper.SysUserRoleMapper;
import com.demo.admin.modules.system.service.impl.SysRoleServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SysRoleService 单元测试")
class SysRoleServiceTest {

    @Spy
    @InjectMocks
    private SysRoleServiceImpl roleService;

    @Mock
    private SysRoleMapper baseMapper; // 必须叫 baseMapper，匹配 ServiceImpl 的字段名

    @Mock
    private SysRoleMenuMapper roleMenuMapper;

    @Mock
    private SysUserRoleMapper userRoleMapper;

    @Test
    @DisplayName("创建角色")
    void testCreateRole() {
        SysRole role = new SysRole();
        role.setName("测试角色");
        role.setCode("test_role");
        List<Long> menuIds = Arrays.asList(1L, 2L, 3L);

        when(baseMapper.insert(any(SysRole.class))).thenReturn(1);
        when(roleMenuMapper.batchInsert(any(), eq(menuIds))).thenReturn(3);

        boolean result = roleService.createRole(role, menuIds);

        assertTrue(result);
        assertEquals(1, role.getStatus());
        assertEquals(0, role.getDeleted());
        verify(roleMenuMapper).batchInsert(any(), eq(menuIds));
    }

    @Test
    @DisplayName("更新角色")
    void testUpdateRole() {
        SysRole role = new SysRole();
        role.setId(1L);
        role.setName("更新角色");
        List<Long> menuIds = Arrays.asList(2L, 3L);

        when(baseMapper.updateById(any(SysRole.class))).thenReturn(1);
        when(roleMenuMapper.deleteByRoleId(1L)).thenReturn(3);
        when(roleMenuMapper.batchInsert(1L, menuIds)).thenReturn(2);

        boolean result = roleService.updateRole(role, menuIds);

        assertTrue(result);
        verify(roleMenuMapper).deleteByRoleId(1L);
        verify(roleMenuMapper).batchInsert(1L, menuIds);
    }

    @Test
    @DisplayName("删除角色 - 成功")
    void testDeleteRole() {
        when(userRoleMapper.countByRoleId(1L)).thenReturn(0);
        when(roleMenuMapper.deleteByRoleId(1L)).thenReturn(3);
        // removeById 内部依赖 MyBatis-Plus TableInfo，用 doReturn 绕过
        doReturn(true).when(roleService).removeById(1L);

        boolean result = roleService.deleteRole(1L);

        assertTrue(result);
        verify(roleMenuMapper).deleteByRoleId(1L);
    }

    @Test
    @DisplayName("删除角色 - 有绑定用户时抛异常")
    void testDeleteRole_HasUsers() {
        when(userRoleMapper.countByRoleId(1L)).thenReturn(5);

        assertThrows(BusinessException.class, () -> roleService.deleteRole(1L));
        verify(roleMenuMapper, never()).deleteByRoleId(anyLong());
        verify(baseMapper, never()).deleteById(anyLong());
    }
}
