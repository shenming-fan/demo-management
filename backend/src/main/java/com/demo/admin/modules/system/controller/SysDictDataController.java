package com.demo.admin.modules.system.controller;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.demo.admin.common.annotation.OperLog;
import com.demo.admin.common.result.PageResult;
import com.demo.admin.common.result.R;
import com.demo.admin.modules.system.entity.SysDictData;
import com.demo.admin.modules.system.service.SysDictDataService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

/**
 * 字典数据控制器
 */
@Api(tags = "字典数据")
@RestController
@RequestMapping("/system/dict/data")
public class SysDictDataController {

    @Autowired
    private SysDictDataService dictDataService;

    @ApiOperation("分页查询字典数据")
    @GetMapping("/page")
    @PreAuthorize("@ss.hasPermi('system:dict:list')")
    public R<PageResult<SysDictData>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam String dictType,
            @RequestParam(required = false) String label,
            @RequestParam(required = false) Integer status) {
        Page<SysDictData> page = new Page<>(current, size);
        LambdaQueryWrapper<SysDictData> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysDictData::getDictType, dictType)
                .like(StrUtil.isNotBlank(label), SysDictData::getLabel, label)
                .eq(status != null, SysDictData::getStatus, status)
                .orderByAsc(SysDictData::getSort);
        return R.ok(PageResult.of(dictDataService.page(page, wrapper)));
    }

    @ApiOperation("根据字典类型查询数据（不分页，给下拉框用）")
    @GetMapping("/type/{dictType}")
    public R<List<SysDictData>> listByType(@PathVariable String dictType) {
        return R.ok(dictDataService.listByDictType(dictType));
    }

    @ApiOperation("查询字典数据详情")
    @GetMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:dict:query')")
    public R<SysDictData> getById(@PathVariable Long id) {
        return R.ok(dictDataService.getById(id));
    }

    @ApiOperation("新增字典数据")
    @PostMapping
    @PreAuthorize("@ss.hasPermi('system:dict:add')")
    @OperLog("新增字典数据")
    public R<Void> create(@Valid @RequestBody SysDictData dictData) {
        dictData.setDeleted(0);
        dictDataService.save(dictData);
        return R.ok();
    }

    @ApiOperation("修改字典数据")
    @PutMapping
    @PreAuthorize("@ss.hasPermi('system:dict:edit')")
    @OperLog("修改字典数据")
    public R<Void> update(@Valid @RequestBody SysDictData dictData) {
        dictDataService.updateById(dictData);
        return R.ok();
    }

    @ApiOperation("删除字典数据")
    @DeleteMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:dict:delete')")
    @OperLog("删除字典数据")
    public R<Void> delete(@PathVariable Long id) {
        dictDataService.removeById(id);
        return R.ok();
    }
}
