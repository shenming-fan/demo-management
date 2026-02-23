package com.demo.admin.modules.system.controller;

import com.demo.admin.common.result.R;
import com.demo.admin.common.utils.RedisUtils;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 缓存监控控制器
 */
@Api(tags = "缓存监控")
@RestController
@RequestMapping("/system/cache")
public class SysCacheController {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private RedisUtils redisUtils;

    @ApiOperation("获取Redis信息")
    @GetMapping("/info")
    @PreAuthorize("@ss.hasPermi('system:cache:list')")
    public R<Map<String, Object>> info() {
        Map<String, Object> result = new LinkedHashMap<>();
        RedisConnection connection = redisTemplate.getConnectionFactory().getConnection();
        try {
            Properties info = connection.info();
            if (info != null) {
                result.put("version", info.getProperty("redis_version"));
                result.put("mode", info.getProperty("redis_mode"));
                result.put("os", info.getProperty("os"));
                result.put("tcpPort", info.getProperty("tcp_port"));

                // 运行时长
                String uptimeSeconds = info.getProperty("uptime_in_seconds");
                if (uptimeSeconds != null) {
                    long seconds = Long.parseLong(uptimeSeconds);
                    long days = seconds / 86400;
                    long hours = (seconds % 86400) / 3600;
                    long minutes = (seconds % 3600) / 60;
                    String uptime;
                    if (days > 0) {
                        uptime = days + "天" + hours + "小时" + minutes + "分钟";
                    } else if (hours > 0) {
                        uptime = hours + "小时" + minutes + "分钟";
                    } else {
                        uptime = minutes + "分钟";
                    }
                    result.put("uptime", uptime);
                }

                // 连接数
                result.put("connectedClients", info.getProperty("connected_clients"));

                // 内存
                result.put("usedMemory", info.getProperty("used_memory_human"));
                result.put("usedMemoryRss", info.getProperty("used_memory_rss_human"));
                result.put("maxMemory", info.getProperty("maxmemory_human"));
                String usedMemoryBytes = info.getProperty("used_memory");
                String maxMemoryBytes = info.getProperty("maxmemory");
                if (usedMemoryBytes != null && maxMemoryBytes != null) {
                    long used = Long.parseLong(usedMemoryBytes);
                    long max = Long.parseLong(maxMemoryBytes);
                    if (max > 0) {
                        result.put("memoryUsageRate", String.format("%.1f", used * 100.0 / max));
                    } else {
                        result.put("memoryUsageRate", "0");
                    }
                } else {
                    result.put("memoryUsageRate", "0");
                }

                // key数量
                Long dbSize = connection.dbSize();
                result.put("dbSize", dbSize != null ? dbSize : 0);

                // 命令统计
                result.put("totalCommandsProcessed", info.getProperty("total_commands_processed"));
                result.put("instantaneousOpsPerSec", info.getProperty("instantaneous_ops_per_sec"));
            }
        } finally {
            connection.close();
        }
        return R.ok(result);
    }

    @ApiOperation("获取缓存key列表")
    @GetMapping("/keys")
    @PreAuthorize("@ss.hasPermi('system:cache:list')")
    public R<List<Map<String, Object>>> keys(@RequestParam(required = false) String prefix) {
        String pattern = (prefix != null && !prefix.isEmpty()) ? prefix + "*" : "*";
        Set<String> keySet = redisUtils.keys(pattern);
        List<Map<String, Object>> list = new ArrayList<>();
        if (keySet != null) {
            for (String key : keySet) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("key", key);
                Long ttl = redisUtils.getExpire(key);
                item.put("ttl", ttl);
                list.add(item);
            }
        }
        return R.ok(list);
    }

    @ApiOperation("获取缓存key的值")
    @GetMapping("/value/{key}")
    @PreAuthorize("@ss.hasPermi('system:cache:list')")
    public R<Object> getValue(@PathVariable String key) {
        Object value = redisUtils.get(key);
        return R.ok(value);
    }

    @ApiOperation("删除指定缓存key")
    @DeleteMapping("/{key}")
    @PreAuthorize("@ss.hasPermi('system:cache:delete')")
    public R<Void> deleteKey(@PathVariable String key) {
        redisUtils.delete(key);
        return R.ok();
    }

    @ApiOperation("清空指定前缀的缓存")
    @DeleteMapping("/clear")
    @PreAuthorize("@ss.hasPermi('system:cache:delete')")
    public R<Void> clearByPrefix(@RequestParam String prefix) {
        Set<String> keys = redisUtils.keys(prefix + "*");
        if (keys != null && !keys.isEmpty()) {
            redisUtils.delete(keys);
        }
        return R.ok();
    }
}
