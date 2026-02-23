package com.demo.admin.modules.system.service;

import com.demo.admin.modules.system.entity.SysDept;
import com.demo.admin.modules.system.mapper.SysDeptMapper;
import com.demo.admin.modules.system.service.impl.SysDeptServiceImpl;
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
@DisplayName("SysDeptService 单元测试")
class SysDeptServiceTest {

    @Spy
    @InjectMocks
    private SysDeptServiceImpl deptService;

    @Mock
    private SysDeptMapper baseMapper;

    // 辅助方法：创建部门对象
    private SysDept createDept(Long id, Long parentId, String name) {
        SysDept dept = new SysDept();
        dept.setId(id);
        dept.setParentId(parentId);
        dept.setName(name);
        dept.setSort(0);
        dept.setStatus(1);
        return dept;
    }

    @Test
    @DisplayName("构建部门树 - 二级结构")
    void testBuildDeptTree_TwoLevels() {
        SysDept root = createDept(1L, 0L, "总公司");
        SysDept child1 = createDept(2L, 1L, "研发部");
        SysDept child2 = createDept(3L, 1L, "市场部");

        List<SysDept> depts = Arrays.asList(root, child1, child2);
        List<SysDept> tree = deptService.buildDeptTree(depts);

        assertEquals(1, tree.size());
        SysDept rootNode = tree.get(0);
        assertEquals("总公司", rootNode.getName());
        assertNotNull(rootNode.getChildren());
        assertEquals(2, rootNode.getChildren().size());
        assertEquals("研发部", rootNode.getChildren().get(0).getName());
    }

    @Test
    @DisplayName("构建部门树 - 三级结构")
    void testBuildDeptTree_ThreeLevels() {
        SysDept root = createDept(1L, 0L, "总公司");
        SysDept dept = createDept(2L, 1L, "研发部");
        SysDept team = createDept(3L, 2L, "Java组");

        List<SysDept> depts = Arrays.asList(root, dept, team);
        List<SysDept> tree = deptService.buildDeptTree(depts);

        assertEquals(1, tree.size());
        SysDept deptNode = tree.get(0).getChildren().get(0);
        assertEquals("研发部", deptNode.getName());
        assertEquals(1, deptNode.getChildren().size());
        assertEquals("Java组", deptNode.getChildren().get(0).getName());
    }

    @Test
    @DisplayName("构建部门树 - 空列表")
    void testBuildDeptTree_Empty() {
        List<SysDept> tree = deptService.buildDeptTree(new ArrayList<>());

        assertTrue(tree.isEmpty());
    }

    @Test
    @DisplayName("获取子部门ID - 递归收集所有后代")
    void testGetChildDeptIds_Recursive() {
        // 模拟: 1(总公司) → 2(研发部) → 4(Java组), 3(市场部)
        SysDept d1 = createDept(1L, 0L, "总公司");
        SysDept d2 = createDept(2L, 1L, "研发部");
        SysDept d3 = createDept(3L, 1L, "市场部");
        SysDept d4 = createDept(4L, 2L, "Java组");

        // list() 内部调用 selectList(null)
        when(baseMapper.selectList(any())).thenReturn(Arrays.asList(d1, d2, d3, d4));

        List<Long> ids = deptService.getChildDeptIds(1L);

        assertEquals(4, ids.size()); // 1, 2, 3, 4 全部包含
        assertTrue(ids.contains(1L)); // 自身
        assertTrue(ids.contains(2L)); // 直接子部门
        assertTrue(ids.contains(3L)); // 直接子部门
        assertTrue(ids.contains(4L)); // 孙子部门
    }

    @Test
    @DisplayName("获取子部门ID - 叶子节点只返回自身")
    void testGetChildDeptIds_LeafNode() {
        SysDept d1 = createDept(1L, 0L, "总公司");
        SysDept d2 = createDept(2L, 1L, "研发部");

        when(baseMapper.selectList(any())).thenReturn(Arrays.asList(d1, d2));

        // 查询叶子节点 2
        List<Long> ids = deptService.getChildDeptIds(2L);

        assertEquals(1, ids.size());
        assertTrue(ids.contains(2L)); // 只有自身
    }

    @Test
    @DisplayName("获取子部门ID - null参数返回空列表")
    void testGetChildDeptIds_NullParam() {
        List<Long> ids = deptService.getChildDeptIds(null);

        assertTrue(ids.isEmpty());
        // 不应该查询数据库
        verify(baseMapper, never()).selectList(any());
    }

    @Test
    @DisplayName("多个根部门 - 都能正确构建")
    void testBuildDeptTree_MultipleRoots() {
        SysDept root1 = createDept(1L, 0L, "北京总部");
        SysDept root2 = createDept(2L, 0L, "上海分部");
        SysDept child = createDept(3L, 1L, "技术部");

        List<SysDept> depts = Arrays.asList(root1, root2, child);
        List<SysDept> tree = deptService.buildDeptTree(depts);

        assertEquals(2, tree.size());
        assertEquals("北京总部", tree.get(0).getName());
        assertEquals(1, tree.get(0).getChildren().size());
        assertEquals("上海分部", tree.get(1).getName());
        assertNull(tree.get(1).getChildren()); // 无子部门
    }
}
