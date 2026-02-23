package com.demo.admin.modules.system.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.demo.admin.common.annotation.OperLog;
import com.demo.admin.common.result.R;
import com.demo.admin.modules.system.entity.SysMenu;
import com.demo.admin.modules.system.service.SysMenuService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

/**
 * 菜单管理控制器
 */
@Api(tags = "菜单管理")
@RestController
@RequestMapping("/system/menu")
public class SysMenuController {

    @Autowired
    private SysMenuService menuService;

    @ApiOperation("获取菜单列表")
    @GetMapping("/list")
    @PreAuthorize("@ss.hasPermi('system:menu:list')")
    public R<List<SysMenu>> list(@RequestParam(required = false) String name,
                                  @RequestParam(required = false) Integer status) {
        LambdaQueryWrapper<SysMenu> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(name != null, SysMenu::getName, name)
                .eq(status != null, SysMenu::getStatus, status)
                .orderByAsc(SysMenu::getSort);
        return R.ok(menuService.list(wrapper));
    }

    @ApiOperation("获取菜单树")
    @GetMapping("/tree")
    public R<List<SysMenu>> tree() {
        List<SysMenu> menus = menuService.listAll();
        return R.ok(menuService.buildMenuTree(menus));
    }

    @ApiOperation("获取菜单详情")
    @GetMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:menu:query')")
    public R<SysMenu> getById(@PathVariable Long id) {
        return R.ok(menuService.getById(id));
    }

    @ApiOperation("创建菜单")
    @PostMapping
    @PreAuthorize("@ss.hasPermi('system:menu:add')")
    @OperLog("新增菜单")
    public R<Void> create(@Valid @RequestBody SysMenu menu) {
        menu.setStatus(1);
        menu.setDeleted(0);
        menuService.save(menu);
        return R.ok();
    }

    @ApiOperation("更新菜单")
    @PutMapping
    @PreAuthorize("@ss.hasPermi('system:menu:edit')")
    @OperLog("修改菜单")
    public R<Void> update(@Valid @RequestBody SysMenu menu) {
        menuService.updateById(menu);
        return R.ok();
    }

    @ApiOperation("删除菜单")
    @DeleteMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:menu:delete')")
    @OperLog("删除菜单")
    public R<Void> delete(@PathVariable Long id) {
        // 检查是否存在子菜单
        long childCount = menuService.count(new LambdaQueryWrapper<SysMenu>()
                .eq(SysMenu::getParentId, id));
        if (childCount > 0) {
            return R.fail("存在子菜单，无法删除");
        }
        menuService.removeById(id);
        return R.ok();
    }

    @ApiOperation("批量更新排序")
    @PutMapping("/sort")
    @PreAuthorize("@ss.hasPermi('system:menu:edit')")
    @OperLog("菜单排序")
    public R<Void> updateSort(@RequestBody List<Map<String, Object>> sortList) {
        for (Map<String, Object> item : sortList) {
            Long id = Long.valueOf(item.get("id").toString());
            Integer sort = Integer.valueOf(item.get("sort").toString());
            SysMenu menu = new SysMenu();
            menu.setId(id);
            menu.setSort(sort);
            menuService.updateById(menu);
        }
        return R.ok();
    }
}
