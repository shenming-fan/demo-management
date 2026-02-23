package com.demo.admin.modules.system.controller;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.demo.admin.common.annotation.OperLog;
import com.demo.admin.common.result.PageResult;
import com.demo.admin.common.result.R;
import com.demo.admin.modules.system.entity.SysConfig;
import com.demo.admin.modules.system.service.SysConfigService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 参数配置控制器
 */
@Api(tags = "参数配置")
@RestController
@RequestMapping("/system/config")
public class SysConfigController {

    @Autowired
    private SysConfigService configService;

    @ApiOperation("分页查询参数配置")
    @GetMapping("/list")
    @PreAuthorize("@ss.hasPermi('system:config:list')")
    public R<PageResult<SysConfig>> list(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String configName,
            @RequestParam(required = false) String configKey,
            @RequestParam(required = false) Integer configType) {
        Page<SysConfig> page = new Page<>(current, size);
        LambdaQueryWrapper<SysConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StrUtil.isNotBlank(configName), SysConfig::getConfigName, configName)
                .like(StrUtil.isNotBlank(configKey), SysConfig::getConfigKey, configKey)
                .eq(configType != null, SysConfig::getConfigType, configType)
                .orderByDesc(SysConfig::getCreateTime);
        return R.ok(PageResult.of(configService.page(page, wrapper)));
    }

    @ApiOperation("获取参数配置详情")
    @GetMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:config:list')")
    public R<SysConfig> getById(@PathVariable Long id) {
        return R.ok(configService.getById(id));
    }

    @ApiOperation("根据key获取参数值")
    @GetMapping("/key/{configKey}")
    public R<String> getByKey(@PathVariable String configKey) {
        return R.ok(configService.getConfigByKey(configKey));
    }

    @ApiOperation("新增参数配置")
    @PostMapping
    @PreAuthorize("@ss.hasPermi('system:config:add')")
    @OperLog("新增参数配置")
    public R<Void> create(@RequestBody SysConfig config) {
        // 检查键名唯一性
        long count = configService.count(new LambdaQueryWrapper<SysConfig>()
                .eq(SysConfig::getConfigKey, config.getConfigKey()));
        if (count > 0) {
            return R.fail("参数键名已存在");
        }
        config.setDeleted(0);
        configService.save(config);
        return R.ok();
    }

    @ApiOperation("修改参数配置")
    @PutMapping
    @PreAuthorize("@ss.hasPermi('system:config:edit')")
    @OperLog("修改参数配置")
    public R<Void> update(@RequestBody SysConfig config) {
        // 检查键名唯一性（排除自身）
        long count = configService.count(new LambdaQueryWrapper<SysConfig>()
                .eq(SysConfig::getConfigKey, config.getConfigKey())
                .ne(SysConfig::getId, config.getId()));
        if (count > 0) {
            return R.fail("参数键名已存在");
        }
        configService.updateById(config);
        // 同步更新Redis缓存
        configService.refreshCache();
        return R.ok();
    }

    @ApiOperation("删除参数配置")
    @DeleteMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:config:delete')")
    @OperLog("删除参数配置")
    public R<Void> delete(@PathVariable Long id) {
        SysConfig config = configService.getById(id);
        if (config != null && config.getConfigType() == 0) {
            return R.fail("系统内置参数不可删除");
        }
        configService.removeById(id);
        // 同步更新Redis缓存
        configService.refreshCache();
        return R.ok();
    }

    @ApiOperation("批量删除参数配置")
    @DeleteMapping("/batch")
    @PreAuthorize("@ss.hasPermi('system:config:delete')")
    @OperLog("批量删除参数配置")
    public R<Void> batchDelete(@RequestBody List<Long> ids) {
        // 检查是否包含系统内置参数
        for (Long id : ids) {
            SysConfig config = configService.getById(id);
            if (config != null && config.getConfigType() == 0) {
                return R.fail("系统内置参数【" + config.getConfigName() + "】不可删除");
            }
        }
        configService.removeByIds(ids);
        configService.refreshCache();
        return R.ok();
    }

    @ApiOperation("刷新参数缓存")
    @PostMapping("/refreshCache")
    @PreAuthorize("@ss.hasPermi('system:config:edit')")
    @OperLog("刷新参数缓存")
    public R<Void> refreshCache() {
        configService.refreshCache();
        return R.ok();
    }

    @ApiOperation("根据key更新参数值")
    @PutMapping("/updateByKey")
    @PreAuthorize("@ss.hasPermi('system:config:edit')")
    @OperLog("修改系统配置")
    public R<Void> updateByKey(@RequestBody Map<String, String> params) {
        String configKey = params.get("configKey");
        String configValue = params.get("configValue");
        if (StrUtil.isBlank(configKey)) {
            return R.fail("参数键名不能为空");
        }
        SysConfig config = configService.getOne(new LambdaQueryWrapper<SysConfig>()
                .eq(SysConfig::getConfigKey, configKey));
        if (config == null) {
            return R.fail("参数不存在");
        }
        config.setConfigValue(configValue);
        configService.updateById(config);
        configService.refreshCache();
        return R.ok();
    }
}
