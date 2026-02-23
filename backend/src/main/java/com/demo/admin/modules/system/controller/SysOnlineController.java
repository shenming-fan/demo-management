package com.demo.admin.modules.system.controller;

import com.demo.admin.common.annotation.OperLog;
import com.demo.admin.common.constant.RedisConstant;
import com.demo.admin.common.result.R;
import com.demo.admin.common.utils.RedisUtils;
import com.demo.admin.security.service.LoginUser;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 在线用户控制器
 */
@Api(tags = "在线用户")
@RestController
@RequestMapping("/system/online")
public class SysOnlineController {

    @Autowired
    private RedisUtils redisUtils;

    @ApiOperation("获取在线用户列表")
    @GetMapping("/list")
    @PreAuthorize("@ss.hasPermi('system:online:list')")
    public R<List<Map<String, Object>>> list(@RequestParam(required = false) String username) {
        Set<String> keys = redisUtils.keys(RedisConstant.TOKEN_PREFIX + "*");
        List<Map<String, Object>> result = new ArrayList<>();

        if (keys != null) {
            for (String key : keys) {
                Object obj = redisUtils.get(key);
                if (obj instanceof LoginUser) {
                    LoginUser user = (LoginUser) obj;
                    // 按用户名筛选
                    if (username != null && !username.isEmpty()
                            && !user.getUsername().contains(username)) {
                        continue;
                    }
                    Map<String, Object> info = new LinkedHashMap<>();
                    info.put("tokenKey", key.replace(RedisConstant.TOKEN_PREFIX, ""));
                    info.put("userId", user.getUserId());
                    info.put("username", user.getUsername());
                    info.put("nickname", user.getNickname());
                    info.put("browser", user.getBrowser() != null ? user.getBrowser() : "-");
                    info.put("os", user.getOs() != null ? user.getOs() : "-");
                    info.put("ip", user.getLoginIp() != null ? user.getLoginIp() : "-");
                    info.put("loginTime", user.getLoginTime());
                    // 剩余过期时间（秒）
                    Long expire = redisUtils.getExpire(key);
                    info.put("expireTime", expire);
                    result.add(info);
                }
            }
        }

        // 按用户ID排序
        result.sort(Comparator.comparingLong(a -> (Long) a.get("userId")));
        return R.ok(result);
    }

    @ApiOperation("强制下线")
    @DeleteMapping("/{tokenKey}")
    @PreAuthorize("@ss.hasPermi('system:online:forceLogout')")
    @OperLog("强制下线用户")
    public R<Void> forceLogout(@PathVariable String tokenKey) {
        redisUtils.delete(RedisConstant.TOKEN_PREFIX + tokenKey);
        return R.ok();
    }
}
