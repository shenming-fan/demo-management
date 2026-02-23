package com.demo.admin.modules.system.controller;

import com.demo.admin.common.result.R;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;
import java.lang.management.RuntimeMXBean;
import java.net.InetAddress;
import java.util.*;

/**
 * 服务监控控制器
 */
@Api(tags = "服务监控")
@RestController
@RequestMapping("/system/server")
public class SysServerController {

    @ApiOperation("获取服务器信息")
    @GetMapping
    @PreAuthorize("@ss.hasPermi('system:server:list')")
    public R<Map<String, Object>> getServerInfo() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("jvm", getJvmInfo());
        data.put("mem", getMemInfo());
        data.put("sys", getSysInfo());
        data.put("disk", getDiskInfo());
        return R.ok(data);
    }

    /**
     * JVM 信息
     */
    private Map<String, Object> getJvmInfo() {
        Map<String, Object> jvm = new LinkedHashMap<>();
        Runtime runtime = Runtime.getRuntime();
        RuntimeMXBean runtimeMXBean = ManagementFactory.getRuntimeMXBean();
        MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();

        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long maxMemory = runtime.maxMemory();
        long usedMemory = totalMemory - freeMemory;

        jvm.put("javaVersion", System.getProperty("java.version"));
        jvm.put("javaHome", System.getProperty("java.home"));
        jvm.put("totalMemory", formatByte(totalMemory));
        jvm.put("maxMemory", formatByte(maxMemory));
        jvm.put("usedMemory", formatByte(usedMemory));
        jvm.put("freeMemory", formatByte(freeMemory));
        jvm.put("usageRate", percent(usedMemory, totalMemory));

        // JVM 启动时间
        long startTime = runtimeMXBean.getStartTime();
        long uptime = runtimeMXBean.getUptime();
        jvm.put("startTime", new Date(startTime).toString());
        jvm.put("runTime", formatDuration(uptime));

        // 堆内存
        jvm.put("heapUsed", formatByte(memoryMXBean.getHeapMemoryUsage().getUsed()));
        jvm.put("heapMax", formatByte(memoryMXBean.getHeapMemoryUsage().getMax()));

        return jvm;
    }

    /**
     * 系统内存信息
     */
    private Map<String, Object> getMemInfo() {
        Map<String, Object> mem = new LinkedHashMap<>();
        OperatingSystemMXBean os = ManagementFactory.getOperatingSystemMXBean();

        if (os instanceof com.sun.management.OperatingSystemMXBean) {
            com.sun.management.OperatingSystemMXBean sunOs = (com.sun.management.OperatingSystemMXBean) os;
            long totalPhysical = sunOs.getTotalPhysicalMemorySize();
            long freePhysical = sunOs.getFreePhysicalMemorySize();
            long usedPhysical = totalPhysical - freePhysical;

            mem.put("total", formatByte(totalPhysical));
            mem.put("used", formatByte(usedPhysical));
            mem.put("free", formatByte(freePhysical));
            mem.put("usageRate", percent(usedPhysical, totalPhysical));
        }

        return mem;
    }

    /**
     * 系统信息
     */
    private Map<String, Object> getSysInfo() {
        Map<String, Object> sys = new LinkedHashMap<>();
        OperatingSystemMXBean os = ManagementFactory.getOperatingSystemMXBean();

        sys.put("osName", System.getProperty("os.name"));
        sys.put("osArch", System.getProperty("os.arch"));
        sys.put("availableProcessors", os.getAvailableProcessors());

        if (os instanceof com.sun.management.OperatingSystemMXBean) {
            com.sun.management.OperatingSystemMXBean sunOs = (com.sun.management.OperatingSystemMXBean) os;
            double cpuLoad = sunOs.getSystemCpuLoad();
            // 首次调用可能返回-1，改用进程CPU
            if (cpuLoad < 0) {
                cpuLoad = sunOs.getProcessCpuLoad();
            }
            sys.put("cpuUsage", cpuLoad >= 0 ? String.format("%.1f%%", cpuLoad * 100) : "N/A");
        }

        try {
            InetAddress addr = InetAddress.getLocalHost();
            sys.put("hostName", addr.getHostName());
            sys.put("hostAddress", addr.getHostAddress());
        } catch (Exception e) {
            sys.put("hostName", "未知");
            sys.put("hostAddress", "未知");
        }

        sys.put("userDir", System.getProperty("user.dir"));
        return sys;
    }

    /**
     * 磁盘信息
     */
    private List<Map<String, Object>> getDiskInfo() {
        List<Map<String, Object>> disks = new ArrayList<>();
        File[] roots = File.listRoots();
        for (File root : roots) {
            long total = root.getTotalSpace();
            if (total == 0) continue;
            long free = root.getFreeSpace();
            long used = total - free;
            Map<String, Object> disk = new LinkedHashMap<>();
            disk.put("path", root.getAbsolutePath());
            disk.put("total", formatByte(total));
            disk.put("used", formatByte(used));
            disk.put("free", formatByte(free));
            disk.put("usageRate", percent(used, total));
            disks.add(disk);
        }
        return disks;
    }

    private String formatByte(long bytes) {
        if (bytes < 1024) return bytes + " B";
        double kb = bytes / 1024.0;
        if (kb < 1024) return String.format("%.1f KB", kb);
        double mb = kb / 1024.0;
        if (mb < 1024) return String.format("%.1f MB", mb);
        double gb = mb / 1024.0;
        return String.format("%.2f GB", gb);
    }

    private String percent(long used, long total) {
        if (total == 0) return "0%";
        return String.format("%.1f%%", used * 100.0 / total);
    }

    private String formatDuration(long millis) {
        long seconds = millis / 1000;
        long days = seconds / 86400;
        long hours = (seconds % 86400) / 3600;
        long minutes = (seconds % 3600) / 60;
        if (days > 0) return days + "天" + hours + "小时" + minutes + "分钟";
        if (hours > 0) return hours + "小时" + minutes + "分钟";
        return minutes + "分钟";
    }
}
