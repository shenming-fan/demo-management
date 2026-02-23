package com.demo.admin.modules.system.controller;

import cn.hutool.poi.excel.ExcelUtil;
import cn.hutool.poi.excel.ExcelWriter;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.demo.admin.common.annotation.OperLog;
import com.demo.admin.common.result.PageResult;
import com.demo.admin.common.result.R;
import com.demo.admin.modules.system.entity.SysRole;
import com.demo.admin.modules.system.service.SysMenuService;
import com.demo.admin.modules.system.service.SysRoleService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * 角色管理控制器
 */
@Api(tags = "角色管理")
@RestController
@RequestMapping("/system/role")
public class SysRoleController {

    @Autowired
    private SysRoleService roleService;

    @Autowired
    private SysMenuService menuService;

    @ApiOperation("分页查询角色")
    @GetMapping("/page")
    @PreAuthorize("@ss.hasPermi('system:role:list')")
    public R<PageResult<SysRole>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Integer status) {

        Page<SysRole> page = new Page<>(current, size);
        LambdaQueryWrapper<SysRole> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.isNotBlank(name), SysRole::getName, name)
                .eq(status != null, SysRole::getStatus, status)
                .orderByAsc(SysRole::getSort);

        return R.ok(PageResult.of(roleService.page(page, wrapper)));
    }

    @ApiOperation("获取所有启用的角色")
    @GetMapping("/list")
    public R<List<SysRole>> list() {
        return R.ok(roleService.listEnabled());
    }

    @ApiOperation("获取角色详情")
    @GetMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:role:query')")
    public R<SysRole> getById(@PathVariable Long id) {
        return R.ok(roleService.getById(id));
    }

    @ApiOperation("获取角色的菜单ID列表")
    @GetMapping("/{id}/menus")
    @PreAuthorize("@ss.hasPermi('system:role:query')")
    public R<List<Long>> getRoleMenus(@PathVariable Long id) {
        return R.ok(menuService.getMenuIdsByRoleId(id));
    }

    @ApiOperation("创建角色")
    @PostMapping
    @PreAuthorize("@ss.hasPermi('system:role:add')")
    @OperLog("新增角色")
    public R<Void> create(@Valid @RequestBody SysRole role,
                          @RequestParam(required = false) List<Long> menuIds) {
        roleService.createRole(role, menuIds);
        return R.ok();
    }

    @ApiOperation("更新角色")
    @PutMapping
    @PreAuthorize("@ss.hasPermi('system:role:edit')")
    @OperLog("修改角色")
    public R<Void> update(@Valid @RequestBody SysRole role,
                          @RequestParam(required = false) List<Long> menuIds) {
        roleService.updateRole(role, menuIds);
        return R.ok();
    }

    @ApiOperation("删除角色")
    @DeleteMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:role:delete')")
    @OperLog("删除角色")
    public R<Void> delete(@PathVariable Long id) {
        roleService.deleteRole(id);
        return R.ok();
    }

    @ApiOperation("批量删除角色")
    @DeleteMapping("/batch")
    @PreAuthorize("@ss.hasPermi('system:role:delete')")
    @OperLog("批量删除角色")
    public R<Void> batchDelete(@RequestBody List<Long> ids) {
        if (ids != null) {
            ids.forEach(roleService::deleteRole);
        }
        return R.ok();
    }

    @ApiOperation("导出角色列表")
    @GetMapping("/export")
    @PreAuthorize("@ss.hasPermi('system:role:list')")
    @OperLog("导出角色列表")
    public void export(HttpServletResponse response,
                       @RequestParam(required = false) String name,
                       @RequestParam(required = false) Integer status) throws IOException {
        LambdaQueryWrapper<SysRole> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.isNotBlank(name), SysRole::getName, name)
                .eq(status != null, SysRole::getStatus, status)
                .orderByAsc(SysRole::getSort);
        List<SysRole> list = roleService.list(wrapper);

        ExcelWriter writer = ExcelUtil.getWriter(true);
        writer.addHeaderAlias("name", "角色名称");
        writer.addHeaderAlias("code", "角色编码");
        writer.addHeaderAlias("sort", "排序");
        writer.addHeaderAlias("status", "状态");
        writer.addHeaderAlias("remark", "备注");
        writer.addHeaderAlias("createTime", "创建时间");
        writer.setOnlyAlias(true);

        writer.write(list, true);

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8");
        response.setHeader("Content-Disposition", "attachment;filename=" +
                URLEncoder.encode("角色列表.xlsx", StandardCharsets.UTF_8.name()));
        writer.flush(response.getOutputStream(), true);
        writer.close();
    }
}
