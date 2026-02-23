package com.demo.admin.modules.system.controller;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.demo.admin.common.result.PageResult;
import com.demo.admin.common.result.R;
import com.demo.admin.modules.system.entity.SysJobLog;
import com.demo.admin.modules.system.mapper.SysJobLogMapper;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 定时任务日志控制器
 */
@Api(tags = "定时任务日志")
@RestController
@RequestMapping("/system/job-log")
public class SysJobLogController {

    @Autowired
    private SysJobLogMapper jobLogMapper;

    @ApiOperation("分页查询任务日志")
    @GetMapping("/page")
    @PreAuthorize("@ss.hasPermi('system:job:list')")
    public R<PageResult<SysJobLog>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String jobName,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) Long jobId) {
        Page<SysJobLog> page = new Page<>(current, size);
        LambdaQueryWrapper<SysJobLog> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(jobId != null, SysJobLog::getJobId, jobId)
                .like(StrUtil.isNotBlank(jobName), SysJobLog::getJobName, jobName)
                .eq(status != null, SysJobLog::getStatus, status)
                .orderByDesc(SysJobLog::getCreateTime);
        return R.ok(PageResult.of(jobLogMapper.selectPage(page, wrapper)));
    }

    @ApiOperation("删除任务日志")
    @DeleteMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:job:delete')")
    public R<Void> delete(@PathVariable Long id) {
        jobLogMapper.deleteById(id);
        return R.ok();
    }

    @ApiOperation("批量删除任务日志")
    @DeleteMapping("/batch")
    @PreAuthorize("@ss.hasPermi('system:job:delete')")
    public R<Void> batchDelete(@RequestBody List<Long> ids) {
        jobLogMapper.deleteBatchIds(ids);
        return R.ok();
    }

    @ApiOperation("清空任务日志")
    @DeleteMapping("/clean")
    @PreAuthorize("@ss.hasPermi('system:job:delete')")
    public R<Void> clean() {
        jobLogMapper.delete(new LambdaQueryWrapper<>());
        return R.ok();
    }
}
