package com.demo.admin.modules.system.controller;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.demo.admin.common.annotation.OperLog;
import com.demo.admin.common.result.PageResult;
import com.demo.admin.common.result.R;
import com.demo.admin.modules.system.entity.SysJob;
import com.demo.admin.modules.system.mapper.SysJobMapper;
import com.demo.admin.modules.system.service.ScheduleService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 定时任务控制器
 */
@Api(tags = "定时任务")
@RestController
@RequestMapping("/system/job")
public class SysJobController {

    @Autowired
    private SysJobMapper jobMapper;

    @Autowired
    private ScheduleService scheduleService;

    @ApiOperation("分页查询定时任务")
    @GetMapping("/page")
    @PreAuthorize("@ss.hasPermi('system:job:list')")
    public R<PageResult<SysJob>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String jobName,
            @RequestParam(required = false) Integer status) {
        Page<SysJob> page = new Page<>(current, size);
        LambdaQueryWrapper<SysJob> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StrUtil.isNotBlank(jobName), SysJob::getJobName, jobName)
                .eq(status != null, SysJob::getStatus, status)
                .orderByDesc(SysJob::getCreateTime);
        return R.ok(PageResult.of(jobMapper.selectPage(page, wrapper)));
    }

    @OperLog("新增定时任务")
    @ApiOperation("新增定时任务")
    @PostMapping
    @PreAuthorize("@ss.hasPermi('system:job:add')")
    public R<Void> add(@RequestBody SysJob job) {
        jobMapper.insert(job);
        if (job.getStatus() != null && job.getStatus() == 1) {
            scheduleService.addTask(job);
        }
        return R.ok();
    }

    @OperLog("修改定时任务")
    @ApiOperation("修改定时任务")
    @PutMapping
    @PreAuthorize("@ss.hasPermi('system:job:edit')")
    public R<Void> update(@RequestBody SysJob job) {
        scheduleService.updateTask(job);
        return R.ok();
    }

    @OperLog("删除定时任务")
    @ApiOperation("删除定时任务")
    @DeleteMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:job:delete')")
    public R<Void> delete(@PathVariable Long id) {
        scheduleService.removeTask(id);
        jobMapper.deleteById(id);
        return R.ok();
    }

    @OperLog("批量删除定时任务")
    @ApiOperation("批量删除定时任务")
    @DeleteMapping("/batch")
    @PreAuthorize("@ss.hasPermi('system:job:delete')")
    public R<Void> batchDelete(@RequestBody List<Long> ids) {
        for (Long id : ids) {
            scheduleService.removeTask(id);
        }
        jobMapper.deleteBatchIds(ids);
        return R.ok();
    }

    @ApiOperation("暂停任务")
    @PutMapping("/pause/{id}")
    @PreAuthorize("@ss.hasPermi('system:job:edit')")
    public R<Void> pause(@PathVariable Long id) {
        SysJob job = jobMapper.selectById(id);
        if (job != null) {
            scheduleService.pauseTask(job);
        }
        return R.ok();
    }

    @ApiOperation("恢复任务")
    @PutMapping("/resume/{id}")
    @PreAuthorize("@ss.hasPermi('system:job:edit')")
    public R<Void> resume(@PathVariable Long id) {
        SysJob job = jobMapper.selectById(id);
        if (job != null) {
            scheduleService.resumeTask(job);
        }
        return R.ok();
    }

    @ApiOperation("立即执行一次")
    @PostMapping("/run/{id}")
    @PreAuthorize("@ss.hasPermi('system:job:edit')")
    public R<Void> run(@PathVariable Long id) {
        SysJob job = jobMapper.selectById(id);
        if (job != null) {
            scheduleService.runOnce(job);
        }
        return R.ok();
    }
}
