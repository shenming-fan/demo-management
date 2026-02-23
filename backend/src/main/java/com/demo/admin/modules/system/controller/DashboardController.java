package com.demo.admin.modules.system.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.demo.admin.common.result.R;
import com.demo.admin.modules.system.entity.SysLog;
import com.demo.admin.modules.system.entity.SysNotice;
import com.demo.admin.modules.system.mapper.SysLogMapper;
import com.demo.admin.modules.system.mapper.SysNoticeMapper;
import com.demo.admin.modules.system.mapper.SysLoginLogMapper;
import com.demo.admin.modules.system.entity.SysLoginLog;
import com.demo.admin.modules.system.service.*;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 仪表盘控制器
 */
@Api(tags = "仪表盘")
@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    @Autowired
    private SysUserService userService;

    @Autowired
    private SysRoleService roleService;

    @Autowired
    private SysMenuService menuService;

    @Autowired
    private SysLogService logService;

    @Autowired
    private SysLogMapper logMapper;

    @Autowired
    private SysNoticeMapper noticeMapper;

    @Autowired
    private SysLoginLogMapper loginLogMapper;

    @Autowired
    private SysDeptService deptService;

    @ApiOperation("获取仪表盘统计数据")
    @GetMapping("/stats")
    public R<Map<String, Object>> stats() {
        Map<String, Object> data = new HashMap<>();

        // 用户总数
        data.put("userCount", userService.count());

        // 角色数量
        data.put("roleCount", roleService.count());

        // 菜单数量
        data.put("menuCount", menuService.count());

        // 今日操作数
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        long todayLogCount = logService.count(
                new LambdaQueryWrapper<SysLog>().ge(SysLog::getCreateTime, todayStart)
        );
        data.put("todayLogCount", todayLogCount);

        // 最近操作（取5条）
        List<SysLog> recentLogs = logService.list(
                new LambdaQueryWrapper<SysLog>()
                        .orderByDesc(SysLog::getCreateTime)
                        .last("LIMIT 5")
        );
        data.put("recentLogs", recentLogs);

        // 最新公告（取5条状态正常的）
        List<SysNotice> recentNotices = noticeMapper.selectList(
                new LambdaQueryWrapper<SysNotice>()
                        .eq(SysNotice::getStatus, 1)
                        .orderByDesc(SysNotice::getCreateTime)
                        .last("LIMIT 5")
        );
        data.put("recentNotices", recentNotices);

        // 近7天操作趋势
        data.put("weeklyTrend", logMapper.selectWeeklyTrend());

        // 操作类型分布（近30天）
        data.put("operationDistribution", logMapper.selectOperationDistribution());

        return R.ok(data);
    }

    @ApiOperation("获取大屏统计数据")
    @GetMapping("/bigscreen")
    public R<Map<String, Object>> bigscreen() {
        Map<String, Object> data = new HashMap<>();

        // 基础统计
        data.put("userCount", userService.count());
        data.put("roleCount", roleService.count());
        data.put("menuCount", menuService.count());
        data.put("deptCount", deptService.count());

        // 今日操作数
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        long todayLogCount = logService.count(
                new LambdaQueryWrapper<SysLog>().ge(SysLog::getCreateTime, todayStart)
        );
        data.put("todayLogCount", todayLogCount);

        // 今日登录数
        long todayLoginCount = loginLogMapper.selectCount(
                new LambdaQueryWrapper<SysLoginLog>().ge(SysLoginLog::getCreateTime, todayStart)
        );
        data.put("todayLoginCount", todayLoginCount);

        // 今日24小时操作趋势
        data.put("hourlyTrend", logMapper.selectTodayHourlyTrend());

        // 近30天操作趋势
        data.put("monthlyTrend", logMapper.selectMonthlyTrend());

        // 操作类型分布
        data.put("operationDistribution", logMapper.selectOperationDistribution());

        // 最近操作流水(10条)
        List<SysLog> recentLogs = logService.list(
                new LambdaQueryWrapper<SysLog>()
                        .orderByDesc(SysLog::getCreateTime)
                        .last("LIMIT 10")
        );
        data.put("recentLogs", recentLogs);

        return R.ok(data);
    }
}
