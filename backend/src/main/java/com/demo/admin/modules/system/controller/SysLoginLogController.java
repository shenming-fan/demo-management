package com.demo.admin.modules.system.controller;

import cn.hutool.core.util.StrUtil;
import cn.hutool.poi.excel.ExcelUtil;
import cn.hutool.poi.excel.ExcelWriter;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.demo.admin.common.annotation.OperLog;
import com.demo.admin.common.result.PageResult;
import com.demo.admin.common.result.R;
import com.demo.admin.modules.system.entity.SysLoginLog;
import com.demo.admin.modules.system.service.SysLoginLogService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * 登录日志控制器
 */
@Api(tags = "登录日志")
@RestController
@RequestMapping("/system/login-log")
public class SysLoginLogController {

    @Autowired
    private SysLoginLogService loginLogService;

    @ApiOperation("分页查询登录日志")
    @GetMapping("/page")
    @PreAuthorize("@ss.hasPermi('system:loginLog:list')")
    public R<PageResult<SysLoginLog>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String beginTime,
            @RequestParam(required = false) String endTime) {
        Page<SysLoginLog> page = new Page<>(current, size);
        LambdaQueryWrapper<SysLoginLog> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StrUtil.isNotBlank(username), SysLoginLog::getUsername, username)
                .eq(status != null, SysLoginLog::getStatus, status)
                .ge(StrUtil.isNotBlank(beginTime), SysLoginLog::getCreateTime, beginTime + " 00:00:00")
                .le(StrUtil.isNotBlank(endTime), SysLoginLog::getCreateTime, endTime + " 23:59:59")
                .orderByDesc(SysLoginLog::getCreateTime);
        return R.ok(PageResult.of(loginLogService.page(page, wrapper)));
    }

    @ApiOperation("删除登录日志")
    @DeleteMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:loginLog:delete')")
    public R<Void> delete(@PathVariable Long id) {
        loginLogService.removeById(id);
        return R.ok();
    }

    @ApiOperation("批量删除登录日志")
    @DeleteMapping("/batch")
    @PreAuthorize("@ss.hasPermi('system:loginLog:delete')")
    public R<Void> batchDelete(@RequestBody java.util.List<Long> ids) {
        if (ids != null && !ids.isEmpty()) {
            loginLogService.removeByIds(ids);
        }
        return R.ok();
    }

    @ApiOperation("清空登录日志")
    @DeleteMapping("/clean")
    @PreAuthorize("@ss.hasPermi('system:loginLog:delete')")
    public R<Void> clean() {
        loginLogService.remove(new LambdaQueryWrapper<>());
        return R.ok();
    }

    @ApiOperation("导出登录日志")
    @GetMapping("/export")
    @PreAuthorize("@ss.hasPermi('system:loginLog:list')")
    @OperLog("导出登录日志")
    public void export(HttpServletResponse response,
                       @RequestParam(required = false) String username,
                       @RequestParam(required = false) Integer status,
                       @RequestParam(required = false) String beginTime,
                       @RequestParam(required = false) String endTime) throws IOException {
        LambdaQueryWrapper<SysLoginLog> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StrUtil.isNotBlank(username), SysLoginLog::getUsername, username)
                .eq(status != null, SysLoginLog::getStatus, status)
                .ge(StrUtil.isNotBlank(beginTime), SysLoginLog::getCreateTime, beginTime + " 00:00:00")
                .le(StrUtil.isNotBlank(endTime), SysLoginLog::getCreateTime, endTime + " 23:59:59")
                .orderByDesc(SysLoginLog::getCreateTime);
        java.util.List<SysLoginLog> list = loginLogService.list(wrapper);

        ExcelWriter writer = ExcelUtil.getWriter(true);
        writer.addHeaderAlias("username", "用户名");
        writer.addHeaderAlias("status", "状态");
        writer.addHeaderAlias("ip", "IP地址");
        writer.addHeaderAlias("message", "提示信息");
        writer.addHeaderAlias("userAgent", "浏览器");
        writer.addHeaderAlias("createTime", "登录时间");
        writer.setOnlyAlias(true);

        writer.write(list, true);

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8");
        response.setHeader("Content-Disposition", "attachment;filename=" +
                URLEncoder.encode("登录日志.xlsx", StandardCharsets.UTF_8.name()));
        writer.flush(response.getOutputStream(), true);
        writer.close();
    }
}
