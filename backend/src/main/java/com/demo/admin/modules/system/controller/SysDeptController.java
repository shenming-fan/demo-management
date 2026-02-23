package com.demo.admin.modules.system.controller;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.demo.admin.common.annotation.OperLog;
import com.demo.admin.common.result.R;
import com.demo.admin.modules.system.entity.SysDept;
import com.demo.admin.modules.system.service.SysDeptService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 部门管理控制器
 */
@Api(tags = "部门管理")
@RestController
@RequestMapping("/system/dept")
public class SysDeptController {

    @Autowired
    private SysDeptService deptService;

    @ApiOperation("获取部门列表（扁平）")
    @GetMapping("/list")
    @PreAuthorize("@ss.hasPermi('system:dept:list')")
    public R<List<SysDept>> list(@RequestParam(required = false) String name,
                                  @RequestParam(required = false) Integer status) {
        LambdaQueryWrapper<SysDept> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StrUtil.isNotBlank(name), SysDept::getName, name)
                .eq(status != null, SysDept::getStatus, status)
                .orderByAsc(SysDept::getSort);
        return R.ok(deptService.list(wrapper));
    }

    @ApiOperation("获取部门树")
    @GetMapping("/tree")
    @PreAuthorize("@ss.hasPermi('system:dept:list')")
    public R<List<SysDept>> tree() {
        List<SysDept> all = deptService.list(
                new LambdaQueryWrapper<SysDept>().orderByAsc(SysDept::getSort));
        return R.ok(deptService.buildDeptTree(all));
    }

    @ApiOperation("获取部门详情")
    @GetMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:dept:query')")
    public R<SysDept> getById(@PathVariable Long id) {
        return R.ok(deptService.getById(id));
    }

    @ApiOperation("新增部门")
    @PostMapping
    @PreAuthorize("@ss.hasPermi('system:dept:add')")
    @OperLog("新增部门")
    public R<Void> create(@RequestBody SysDept dept) {
        deptService.save(dept);
        return R.ok();
    }

    @ApiOperation("修改部门")
    @PutMapping
    @PreAuthorize("@ss.hasPermi('system:dept:edit')")
    @OperLog("修改部门")
    public R<Void> update(@RequestBody SysDept dept) {
        deptService.updateById(dept);
        return R.ok();
    }

    @ApiOperation("删除部门")
    @DeleteMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:dept:delete')")
    @OperLog("删除部门")
    public R<Void> delete(@PathVariable Long id) {
        // 检查是否有子部门
        long childCount = deptService.count(
                new LambdaQueryWrapper<SysDept>().eq(SysDept::getParentId, id));
        if (childCount > 0) {
            return R.fail("存在子部门，不能删除");
        }
        deptService.removeById(id);
        return R.ok();
    }
}
