package com.demo.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.admin.modules.system.entity.SysMenu;
import com.demo.admin.modules.system.mapper.SysMenuMapper;
import com.demo.admin.modules.system.service.SysMenuService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 菜单 Service 实现
 */
@Service
public class SysMenuServiceImpl extends ServiceImpl<SysMenuMapper, SysMenu> implements SysMenuService {

    @Override
    public List<SysMenu> getMenusByUserId(Long userId) {
        return baseMapper.selectMenusByUserId(userId);
    }

    @Override
    public List<Long> getMenuIdsByRoleId(Long roleId) {
        List<SysMenu> menus = baseMapper.selectMenusByRoleId(roleId);
        return menus.stream().map(SysMenu::getId).collect(Collectors.toList());
    }

    @Override
    public List<SysMenu> buildMenuTree(List<SysMenu> menus) {
        List<SysMenu> result = new ArrayList<>();
        List<Long> menuIds = menus.stream().map(SysMenu::getId).collect(Collectors.toList());

        for (SysMenu menu : menus) {
            // 找到根节点
            if (!menuIds.contains(menu.getParentId())) {
                recursiveBuildTree(menus, menu);
                result.add(menu);
            }
        }

        if (result.isEmpty()) {
            result = menus;
        }
        return result;
    }

    /**
     * 递归构建子树
     */
    private void recursiveBuildTree(List<SysMenu> menus, SysMenu parent) {
        List<SysMenu> children = getChildren(menus, parent.getId());
        parent.setChildren(children);
        for (SysMenu child : children) {
            recursiveBuildTree(menus, child);
        }
    }

    /**
     * 获取子菜单
     */
    private List<SysMenu> getChildren(List<SysMenu> menus, Long parentId) {
        return menus.stream()
                .filter(m -> parentId.equals(m.getParentId()))
                .collect(Collectors.toList());
    }

    @Override
    public List<SysMenu> listAll() {
        return list(new LambdaQueryWrapper<SysMenu>()
                .eq(SysMenu::getStatus, 1)
                .orderByAsc(SysMenu::getSort));
    }
}
