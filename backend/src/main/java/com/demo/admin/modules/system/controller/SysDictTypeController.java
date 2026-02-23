package com.demo.admin.modules.system.controller;

import cn.hutool.core.util.StrUtil;
import cn.hutool.poi.excel.ExcelUtil;
import cn.hutool.poi.excel.ExcelWriter;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.demo.admin.common.annotation.OperLog;
import com.demo.admin.common.result.PageResult;
import com.demo.admin.common.result.R;
import com.demo.admin.modules.system.entity.SysDictData;
import com.demo.admin.modules.system.entity.SysDictType;
import com.demo.admin.modules.system.service.SysDictDataService;
import com.demo.admin.modules.system.service.SysDictTypeService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
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
 * 字典类型控制器
 */
@Api(tags = "字典类型")
@RestController
@RequestMapping("/system/dict/type")
public class SysDictTypeController {

    @Autowired
    private SysDictTypeService dictTypeService;

    @Autowired
    private SysDictDataService dictDataService;

    @ApiOperation("分页查询字典类型")
    @GetMapping("/page")
    @PreAuthorize("@ss.hasPermi('system:dict:list')")
    public R<PageResult<SysDictType>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer status) {
        Page<SysDictType> page = new Page<>(current, size);
        LambdaQueryWrapper<SysDictType> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StrUtil.isNotBlank(name), SysDictType::getName, name)
                .like(StrUtil.isNotBlank(type), SysDictType::getType, type)
                .eq(status != null, SysDictType::getStatus, status)
                .orderByDesc(SysDictType::getCreateTime);
        return R.ok(PageResult.of(dictTypeService.page(page, wrapper)));
    }

    @ApiOperation("查询所有字典类型（下拉用）")
    @GetMapping("/list")
    public R<List<SysDictType>> list() {
        return R.ok(dictTypeService.list(new LambdaQueryWrapper<SysDictType>()
                .eq(SysDictType::getStatus, 1)
                .orderByAsc(SysDictType::getId)));
    }

    @ApiOperation("查询字典类型详情")
    @GetMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:dict:query')")
    public R<SysDictType> getById(@PathVariable Long id) {
        return R.ok(dictTypeService.getById(id));
    }

    @ApiOperation("新增字典类型")
    @PostMapping
    @PreAuthorize("@ss.hasPermi('system:dict:add')")
    @OperLog("新增字典类型")
    public R<Void> create(@Valid @RequestBody SysDictType dictType) {
        // 检查类型编码唯一性
        long count = dictTypeService.count(new LambdaQueryWrapper<SysDictType>()
                .eq(SysDictType::getType, dictType.getType()));
        if (count > 0) {
            return R.fail("字典类型编码已存在");
        }
        dictType.setDeleted(0);
        dictTypeService.save(dictType);
        return R.ok();
    }

    @ApiOperation("修改字典类型")
    @PutMapping
    @PreAuthorize("@ss.hasPermi('system:dict:edit')")
    @OperLog("修改字典类型")
    public R<Void> update(@Valid @RequestBody SysDictType dictType) {
        // 检查类型编码唯一性（排除自身）
        long count = dictTypeService.count(new LambdaQueryWrapper<SysDictType>()
                .eq(SysDictType::getType, dictType.getType())
                .ne(SysDictType::getId, dictType.getId()));
        if (count > 0) {
            return R.fail("字典类型编码已存在");
        }
        // 如果修改了 type 编码，同步更新字典数据的 dict_type
        SysDictType old = dictTypeService.getById(dictType.getId());
        if (old != null && !old.getType().equals(dictType.getType())) {
            SysDictData update = new SysDictData();
            update.setDictType(dictType.getType());
            dictDataService.update(update, new LambdaQueryWrapper<SysDictData>()
                    .eq(SysDictData::getDictType, old.getType()));
        }
        dictTypeService.updateById(dictType);
        return R.ok();
    }

    @ApiOperation("删除字典类型")
    @DeleteMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:dict:delete')")
    @OperLog("删除字典类型")
    public R<Void> delete(@PathVariable Long id) {
        SysDictType dictType = dictTypeService.getById(id);
        if (dictType != null) {
            // 删除关联的字典数据
            dictDataService.remove(new LambdaQueryWrapper<SysDictData>()
                    .eq(SysDictData::getDictType, dictType.getType()));
        }
        dictTypeService.removeById(id);
        return R.ok();
    }

    @ApiOperation("批量删除字典类型")
    @DeleteMapping("/batch")
    @PreAuthorize("@ss.hasPermi('system:dict:delete')")
    @OperLog("批量删除字典类型")
    public R<Void> batchDelete(@RequestBody List<Long> ids) {
        for (Long id : ids) {
            SysDictType dictType = dictTypeService.getById(id);
            if (dictType != null) {
                dictDataService.remove(new LambdaQueryWrapper<SysDictData>()
                        .eq(SysDictData::getDictType, dictType.getType()));
            }
        }
        dictTypeService.removeByIds(ids);
        return R.ok();
    }

    @ApiOperation("导出字典类型")
    @GetMapping("/export")
    @PreAuthorize("@ss.hasPermi('system:dict:list')")
    @OperLog("导出字典类型")
    public void export(HttpServletResponse response,
                       @RequestParam(required = false) String name,
                       @RequestParam(required = false) String type,
                       @RequestParam(required = false) Integer status) throws IOException {
        LambdaQueryWrapper<SysDictType> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StrUtil.isNotBlank(name), SysDictType::getName, name)
                .like(StrUtil.isNotBlank(type), SysDictType::getType, type)
                .eq(status != null, SysDictType::getStatus, status)
                .orderByDesc(SysDictType::getCreateTime);
        List<SysDictType> list = dictTypeService.list(wrapper);

        ExcelWriter writer = ExcelUtil.getWriter(true);
        writer.addHeaderAlias("name", "字典名称");
        writer.addHeaderAlias("type", "字典类型");
        writer.addHeaderAlias("status", "状态");
        writer.addHeaderAlias("remark", "备注");
        writer.addHeaderAlias("createTime", "创建时间");
        writer.setOnlyAlias(true);

        writer.write(list, true);

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8");
        response.setHeader("Content-Disposition", "attachment;filename=" +
                URLEncoder.encode("字典类型.xlsx", StandardCharsets.UTF_8.name()));
        writer.flush(response.getOutputStream(), true);
        writer.close();
    }
}
