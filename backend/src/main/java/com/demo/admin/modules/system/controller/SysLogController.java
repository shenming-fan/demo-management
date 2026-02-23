package com.demo.admin.modules.system.controller;

import cn.hutool.core.util.StrUtil;
import cn.hutool.poi.excel.ExcelUtil;
import cn.hutool.poi.excel.ExcelWriter;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.demo.admin.common.annotation.OperLog;
import com.demo.admin.common.result.PageResult;
import com.demo.admin.common.result.R;
import com.demo.admin.modules.system.entity.SysLog;
import com.demo.admin.modules.system.service.SysLogService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * 操作日志控制器
 */
@Api(tags = "操作日志")
@RestController
@RequestMapping("/system/log")
public class SysLogController {

    @Autowired
    private SysLogService logService;

    @ApiOperation("分页查询操作日志")
    @GetMapping("/page")
    @PreAuthorize("@ss.hasPermi('system:log:list')")
    public R<PageResult<SysLog>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String operation,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String beginTime,
            @RequestParam(required = false) String endTime) {
        Page<SysLog> page = new Page<>(current, size);
        LambdaQueryWrapper<SysLog> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StrUtil.isNotBlank(username), SysLog::getUsername, username)
                .like(StrUtil.isNotBlank(operation), SysLog::getOperation, operation)
                .eq(status != null, SysLog::getStatus, status)
                .ge(StrUtil.isNotBlank(beginTime), SysLog::getCreateTime, beginTime != null ? beginTime + " 00:00:00" : null)
                .le(StrUtil.isNotBlank(endTime), SysLog::getCreateTime, endTime != null ? endTime + " 23:59:59" : null)
                .orderByDesc(SysLog::getCreateTime);
        return R.ok(PageResult.of(logService.page(page, wrapper)));
    }

    @ApiOperation("删除日志")
    @DeleteMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:log:delete')")
    public R<Void> delete(@PathVariable Long id) {
        logService.removeById(id);
        return R.ok();
    }

    @ApiOperation("批量删除日志")
    @DeleteMapping("/batch")
    @PreAuthorize("@ss.hasPermi('system:log:delete')")
    public R<Void> batchDelete(@RequestBody List<Long> ids) {
        if (ids != null && !ids.isEmpty()) {
            logService.removeByIds(ids);
        }
        return R.ok();
    }

    @ApiOperation("清空日志")
    @DeleteMapping("/clean")
    @PreAuthorize("@ss.hasPermi('system:log:delete')")
    public R<Void> clean() {
        logService.remove(new LambdaQueryWrapper<>());
        return R.ok();
    }

    @ApiOperation("导出操作日志")
    @GetMapping("/export")
    @PreAuthorize("@ss.hasPermi('system:log:list')")
    @OperLog("导出操作日志")
    public void export(HttpServletResponse response,
                       @RequestParam(required = false) String username,
                       @RequestParam(required = false) String operation,
                       @RequestParam(required = false) Integer status) throws IOException {
        LambdaQueryWrapper<SysLog> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StrUtil.isNotBlank(username), SysLog::getUsername, username)
                .like(StrUtil.isNotBlank(operation), SysLog::getOperation, operation)
                .eq(status != null, SysLog::getStatus, status)
                .orderByDesc(SysLog::getCreateTime);
        List<SysLog> list = logService.list(wrapper);

        ExcelWriter writer = ExcelUtil.getWriter(true);
        writer.addHeaderAlias("username", "操作用户");
        writer.addHeaderAlias("operation", "操作描述");
        writer.addHeaderAlias("method", "请求方法");
        writer.addHeaderAlias("params", "请求参数");
        writer.addHeaderAlias("time", "耗时(ms)");
        writer.addHeaderAlias("ip", "IP地址");
        writer.addHeaderAlias("status", "状态");
        writer.addHeaderAlias("errorMsg", "错误信息");
        writer.addHeaderAlias("createTime", "操作时间");
        writer.setOnlyAlias(true);

        writer.write(list, true);

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8");
        response.setHeader("Content-Disposition", "attachment;filename=" +
                URLEncoder.encode("操作日志.xlsx", StandardCharsets.UTF_8.name()));
        writer.flush(response.getOutputStream(), true);
        writer.close();
    }
}
