package com.demo.admin.modules.system.service;

import com.demo.admin.modules.system.entity.SysMenu;
import com.demo.admin.modules.system.mapper.SysMenuMapper;
import com.demo.admin.modules.system.service.impl.SysMenuServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SysMenuService 单元测试")
class SysMenuServiceTest {

    @Spy
    @InjectMocks
    private SysMenuServiceImpl menuService;

    @Mock
    private SysMenuMapper baseMapper;

    // 辅助方法：创建菜单对象
    private SysMenu createMenu(Long id, Long parentId, String name, Integer type) {
        SysMenu menu = new SysMenu();
        menu.setId(id);
        menu.setParentId(parentId);
        menu.setName(name);
        menu.setType(type);
        menu.setSort(0);
        menu.setStatus(1);
        return menu;
    }

    @Test
    @DisplayName("构建二级菜单树 - 根目录包含子菜单")
    void testBuildMenuTree_TwoLevels() {
        SysMenu root = createMenu(1L, 0L, "系统管理", 1);
        SysMenu child1 = createMenu(2L, 1L, "用户管理", 2);
        SysMenu child2 = createMenu(3L, 1L, "角色管理", 2);

        List<SysMenu> menus = Arrays.asList(root, child1, child2);
        List<SysMenu> tree = menuService.buildMenuTree(menus);

        assertEquals(1, tree.size());
        SysMenu rootNode = tree.get(0);
        assertEquals("系统管理", rootNode.getName());
        assertNotNull(rootNode.getChildren());
        assertEquals(2, rootNode.getChildren().size());
        assertEquals("用户管理", rootNode.getChildren().get(0).getName());
        assertEquals("角色管理", rootNode.getChildren().get(1).getName());
    }

    @Test
    @DisplayName("构建三级菜单树 - 目录→菜单→按钮")
    void testBuildMenuTree_ThreeLevels() {
        SysMenu dir = createMenu(1L, 0L, "系统管理", 1);
        SysMenu menu = createMenu(2L, 1L, "用户管理", 2);
        SysMenu button1 = createMenu(3L, 2L, "新增用户", 3);
        SysMenu button2 = createMenu(4L, 2L, "删除用户", 3);

        List<SysMenu> menus = Arrays.asList(dir, menu, button1, button2);
        List<SysMenu> tree = menuService.buildMenuTree(menus);

        assertEquals(1, tree.size());
        SysMenu dirNode = tree.get(0);
        assertEquals(1, dirNode.getChildren().size());

        SysMenu menuNode = dirNode.getChildren().get(0);
        assertEquals("用户管理", menuNode.getName());
        assertEquals(2, menuNode.getChildren().size());
        assertEquals("新增用户", menuNode.getChildren().get(0).getName());
    }

    @Test
    @DisplayName("多个根节点 - 多棵树")
    void testBuildMenuTree_MultipleRoots() {
        SysMenu root1 = createMenu(1L, 0L, "系统管理", 1);
        SysMenu root2 = createMenu(2L, 0L, "监控管理", 1);
        SysMenu child1 = createMenu(3L, 1L, "用户管理", 2);
        SysMenu child2 = createMenu(4L, 2L, "在线用户", 2);

        List<SysMenu> menus = Arrays.asList(root1, root2, child1, child2);
        List<SysMenu> tree = menuService.buildMenuTree(menus);

        assertEquals(2, tree.size());
        assertEquals("系统管理", tree.get(0).getName());
        assertEquals(1, tree.get(0).getChildren().size());
        assertEquals("监控管理", tree.get(1).getName());
        assertEquals(1, tree.get(1).getChildren().size());
    }

    @Test
    @DisplayName("空列表 - 返回空")
    void testBuildMenuTree_EmptyList() {
        List<SysMenu> tree = menuService.buildMenuTree(new ArrayList<>());

        assertTrue(tree.isEmpty());
    }

    @Test
    @DisplayName("叶子菜单无children")
    void testBuildMenuTree_LeafHasNoChildren() {
        SysMenu root = createMenu(1L, 0L, "系统管理", 1);
        SysMenu leaf = createMenu(2L, 1L, "用户管理", 2);

        List<SysMenu> menus = Arrays.asList(root, leaf);
        List<SysMenu> tree = menuService.buildMenuTree(menus);

        SysMenu leafNode = tree.get(0).getChildren().get(0);
        assertTrue(leafNode.getChildren() == null || leafNode.getChildren().isEmpty());
    }

    @Test
    @DisplayName("根据用户ID查询菜单 - 调用Mapper")
    void testGetMenusByUserId() {
        SysMenu menu = createMenu(1L, 0L, "系统管理", 1);
        when(baseMapper.selectMenusByUserId(1L)).thenReturn(Arrays.asList(menu));

        List<SysMenu> result = menuService.getMenusByUserId(1L);

        assertEquals(1, result.size());
        verify(baseMapper).selectMenusByUserId(1L);
    }

    @Test
    @DisplayName("根据角色ID查询菜单ID列表")
    void testGetMenuIdsByRoleId() {
        SysMenu m1 = createMenu(1L, 0L, "系统管理", 1);
        SysMenu m2 = createMenu(2L, 1L, "用户管理", 2);
        when(baseMapper.selectMenusByRoleId(1L)).thenReturn(Arrays.asList(m1, m2));

        List<Long> ids = menuService.getMenuIdsByRoleId(1L);

        assertEquals(2, ids.size());
        assertTrue(ids.contains(1L));
        assertTrue(ids.contains(2L));
    }
}
