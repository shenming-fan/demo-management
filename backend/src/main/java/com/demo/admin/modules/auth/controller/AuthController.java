package com.demo.admin.modules.auth.controller;

import com.demo.admin.common.annotation.OperLog;
import com.demo.admin.common.constant.RedisConstant;
import com.demo.admin.common.result.R;
import com.demo.admin.common.utils.JwtUtils;
import com.demo.admin.common.utils.RedisUtils;
import com.demo.admin.modules.auth.dto.LoginRequest;
import com.demo.admin.modules.auth.dto.LoginResponse;
import com.demo.admin.modules.auth.dto.UserInfoResponse;
import com.demo.admin.modules.system.entity.SysFile;
import com.demo.admin.modules.system.entity.SysMenu;
import com.demo.admin.modules.system.entity.SysUser;
import com.demo.admin.modules.system.service.SysFileService;
import com.demo.admin.modules.system.service.SysMenuService;
import com.demo.admin.modules.system.service.SysUserService;
import com.demo.admin.modules.system.service.SysLoginLogService;
import com.demo.admin.security.service.LoginUser;
import cn.hutool.captcha.CaptchaUtil;
import cn.hutool.captcha.ShearCaptcha;
import cn.hutool.core.util.IdUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * 认证控制器
 */
@Api(tags = "认证管理")
@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private RedisUtils redisUtils;

    @Autowired
    private SysMenuService menuService;

    @Autowired
    private SysUserService userService;

    @Autowired
    private SysLoginLogService loginLogService;

    @Autowired
    private SysFileService fileService;

    @Autowired
    private com.demo.admin.modules.system.service.SysConfigService configService;

    @ApiOperation("获取验证码")
    @GetMapping("/captcha")
    public R<Map<String, String>> getCaptcha() {
        // 生成算术验证码 (如: 3 + 5 = ?)
        ShearCaptcha captcha = CaptchaUtil.createShearCaptcha(130, 38, 4, 2);
        // 算术表达式的结果
        String code = captcha.getCode();
        // 生成唯一key
        String key = IdUtil.simpleUUID();
        // 存入Redis，5分钟过期
        redisUtils.set(RedisConstant.CAPTCHA_PREFIX + key, code,
                RedisConstant.CAPTCHA_EXPIRE, TimeUnit.MINUTES);

        Map<String, String> result = new LinkedHashMap<>();
        result.put("key", key);
        result.put("image", captcha.getImageBase64Data());
        return R.ok(result);
    }

    @ApiOperation("用户登录")
    @PostMapping("/login")
    public R<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String ip = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        // 校验验证码（根据参数配置决定是否开启）
        boolean captchaEnabled = !"false".equals(configService.getConfigByKey("sys.account.captchaEnabled"));
        if (captchaEnabled) {
            if (request.getCaptchaKey() == null || request.getCaptcha() == null) {
                return R.fail("请输入验证码");
            }
            String captchaKey = RedisConstant.CAPTCHA_PREFIX + request.getCaptchaKey();
            Object cachedCode = redisUtils.get(captchaKey);
            // 不管对错都删除，防止重复使用
            redisUtils.delete(captchaKey);
            if (cachedCode == null) {
                return R.fail("验证码已过期");
            }
            if (!cachedCode.toString().equalsIgnoreCase(request.getCaptcha())) {
                return R.fail("验证码错误");
            }
        }

        // 检查账号是否被锁定
        String failKey = RedisConstant.LOGIN_FAIL_PREFIX + request.getUsername();
        Object failCountObj = redisUtils.get(failKey);
        int failCount = failCountObj != null ? Integer.parseInt(failCountObj.toString()) : 0;
        if (failCount >= RedisConstant.LOGIN_MAX_RETRY) {
            Long ttl = redisUtils.getExpire(failKey);
            String ttlMsg = ttl != null && ttl > 0 ? (ttl / 60 + 1) + "分钟" : "稍后";
            loginLogService.recordLoginLog(request.getUsername(), 0, "账号已被锁定", ip, userAgent);
            return R.fail("密码错误次数过多，账号已被锁定，请" + ttlMsg + "后重试");
        }

        Authentication authentication;
        try {
            // 认证
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (AuthenticationException e) {
            // 记录失败次数
            Long newCount = redisUtils.increment(failKey);
            if (newCount != null && newCount == 1) {
                redisUtils.expire(failKey, RedisConstant.LOGIN_LOCK_TIME * 60, TimeUnit.SECONDS);
            }
            int remaining = RedisConstant.LOGIN_MAX_RETRY - (newCount != null ? newCount.intValue() : 0);
            String msg = remaining > 0 ? "用户名或密码错误，还可尝试" + remaining + "次" : "密码错误次数过多，账号已被锁定30分钟";
            loginLogService.recordLoginLog(request.getUsername(), 0, msg, ip, userAgent);
            return R.fail(msg);
        }
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 登录成功，清除失败计数
        redisUtils.delete(failKey);

        // 获取登录用户信息
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();

        // 生成Token
        String token = jwtUtils.generateToken(loginUser.getUsername());

        // 设置设备信息
        loginUser.setLoginIp(ip);
        loginUser.setLoginTime(System.currentTimeMillis());
        loginUser.setTokenKey(token);
        parseUserAgent(userAgent, loginUser);

        // 存入Redis
        redisUtils.set(RedisConstant.TOKEN_PREFIX + token, loginUser,
                jwtUtils.getExpiration(), TimeUnit.MILLISECONDS);
        // 为用户维护会话token索引，避免全量扫描Redis
        String userTokenSetKey = buildUserTokenSetKey(loginUser.getUserId());
        redisUtils.addSetMember(userTokenSetKey, token);
        redisUtils.expire(userTokenSetKey, jwtUtils.getExpiration(), TimeUnit.MILLISECONDS);

        // 记录登录成功日志
        loginLogService.recordLoginLog(loginUser.getUsername(), 1, "登录成功", ip, userAgent);

        // 返回结果
        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setExpireTime(jwtUtils.getExpiration());

        return R.ok("登录成功", response);
    }

    @ApiOperation("获取用户信息")
    @GetMapping("/info")
    public R<UserInfoResponse> getUserInfo() {
        LoginUser loginUser = (LoginUser) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        // 从数据库获取最新信息
        SysUser user = userService.getById(loginUser.getUserId());

        UserInfoResponse response = new UserInfoResponse();
        response.setUserId(loginUser.getUserId());
        response.setUsername(loginUser.getUsername());
        response.setNickname(user != null ? user.getNickname() : loginUser.getNickname());
        response.setAvatar(user != null ? user.getAvatar() : loginUser.getAvatar());
        response.setPhone(user != null ? user.getPhone() : null);
        response.setEmail(user != null ? user.getEmail() : null);
        response.setGender(user != null ? user.getGender() : null);
        response.setRoles(loginUser.getRoles());
        response.setPermissions(loginUser.getPermissions());

        return R.ok(response);
    }

    @ApiOperation("获取用户菜单")
    @GetMapping("/menus")
    public R<List<SysMenu>> getUserMenus() {
        LoginUser loginUser = (LoginUser) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        List<SysMenu> menus = menuService.getMenusByUserId(loginUser.getUserId());
        // 过滤掉按钮（type=3），只保留目录和菜单用于导航
        menus = menus.stream().filter(m -> m.getType() != 3).collect(Collectors.toList());
        return R.ok(menuService.buildMenuTree(menus));
    }

    @OperLog("修改个人信息")
    @ApiOperation("修改个人信息")
    @PutMapping("/profile")
    public R<String> updateProfile(@RequestBody Map<String, Object> params) {
        LoginUser loginUser = (LoginUser) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        SysUser user = new SysUser();
        user.setId(loginUser.getUserId());
        if (params.containsKey("nickname")) {
            user.setNickname((String) params.get("nickname"));
        }
        if (params.containsKey("phone")) {
            user.setPhone((String) params.get("phone"));
        }
        if (params.containsKey("email")) {
            user.setEmail((String) params.get("email"));
        }
        if (params.containsKey("gender")) {
            user.setGender(params.get("gender") != null ? ((Number) params.get("gender")).intValue() : null);
        }

        userService.updateById(user);
        return R.ok("修改成功", null);
    }

    @OperLog("修改头像")
    @ApiOperation("修改头像")
    @PostMapping("/avatar")
    public R<String> updateAvatar(@RequestParam("file") MultipartFile file) {
        LoginUser loginUser = (LoginUser) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        // 复用文件上传模块
        SysFile sysFile = fileService.uploadFile(file);

        // 更新用户头像
        SysUser user = new SysUser();
        user.setId(loginUser.getUserId());
        user.setAvatar(sysFile.getUrl());
        userService.updateById(user);

        return R.ok("头像修改成功", sysFile.getUrl());
    }

    @OperLog("修改密码")
    @ApiOperation("修改密码")
    @PutMapping("/password")
    public R<String> updatePassword(@RequestBody Map<String, String> params) {
        LoginUser loginUser = (LoginUser) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        String oldPassword = params.get("oldPassword");
        String newPassword = params.get("newPassword");
        if (oldPassword == null || newPassword == null) {
            return R.fail("参数不完整");
        }
        userService.updatePassword(loginUser.getUserId(), oldPassword, newPassword);
        return R.ok("密码修改成功", null);
    }

    @ApiOperation("用户登出")
    @PostMapping("/logout")
    public R<String> logout(@RequestHeader(value = "Authorization", required = false) String bearerToken) {
        String token = parseBearerToken(bearerToken);
        if (token != null) {
            String redisTokenKey = RedisConstant.TOKEN_PREFIX + token;
            LoginUser loginUser = redisUtils.get(redisTokenKey, LoginUser.class);
            if (loginUser != null && loginUser.getUserId() != null) {
                redisUtils.removeSetMembers(buildUserTokenSetKey(loginUser.getUserId()), token);
            }
            redisUtils.delete(redisTokenKey);
        }
        SecurityContextHolder.clearContext();
        return R.ok("登出成功", null);
    }

    @ApiOperation("获取当前用户的登录设备列表")
    @GetMapping("/sessions")
    public R<List<Map<String, Object>>> getSessions(@RequestHeader(value = "Authorization", required = false) String bearerToken) {
        LoginUser currentUser = (LoginUser) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        String currentToken = parseBearerToken(bearerToken);
        String userTokenSetKey = buildUserTokenSetKey(currentUser.getUserId());
        Set<Object> tokenSet = redisUtils.getSetMembers(userTokenSetKey);
        List<Map<String, Object>> sessions = new ArrayList<>();

        if (tokenSet != null) {
            for (Object tokenObj : tokenSet) {
                if (tokenObj == null) {
                    continue;
                }
                String tokenKey = String.valueOf(tokenObj);
                String redisTokenKey = RedisConstant.TOKEN_PREFIX + tokenKey;
                LoginUser user = redisUtils.get(redisTokenKey, LoginUser.class);
                if (user == null || !currentUser.getUserId().equals(user.getUserId())) {
                    redisUtils.removeSetMembers(userTokenSetKey, tokenKey);
                    continue;
                }
                Map<String, Object> info = new LinkedHashMap<>();
                info.put("tokenKey", tokenKey);
                info.put("browser", user.getBrowser() != null ? user.getBrowser() : "未知浏览器");
                info.put("os", user.getOs() != null ? user.getOs() : "未知系统");
                info.put("ip", user.getLoginIp() != null ? user.getLoginIp() : "未知");
                info.put("loginTime", user.getLoginTime());
                info.put("current", tokenKey.equals(currentToken));
                Long expire = redisUtils.getExpire(redisTokenKey);
                info.put("expireTime", expire);
                sessions.add(info);
            }
        }

        // 当前设备排在最前
        sessions.sort((a, b) -> {
            boolean aCurrent = (boolean) a.get("current");
            boolean bCurrent = (boolean) b.get("current");
            if (aCurrent != bCurrent) return aCurrent ? -1 : 1;
            Long aTime = (Long) a.get("loginTime");
            Long bTime = (Long) b.get("loginTime");
            if (aTime == null) return 1;
            if (bTime == null) return -1;
            return bTime.compareTo(aTime);
        });

        return R.ok(sessions);
    }

    @ApiOperation("退出指定设备")
    @DeleteMapping("/sessions/{tokenKey}")
    public R<Void> logoutSession(@PathVariable String tokenKey) {
        LoginUser currentUser = (LoginUser) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        String userTokenSetKey = buildUserTokenSetKey(currentUser.getUserId());
        // 验证token属于当前用户
        LoginUser user = redisUtils.get(RedisConstant.TOKEN_PREFIX + tokenKey, LoginUser.class);
        if (user != null && !user.getUserId().equals(currentUser.getUserId())) {
            return R.fail("无权操作");
        }
        redisUtils.delete(RedisConstant.TOKEN_PREFIX + tokenKey);
        redisUtils.removeSetMembers(userTokenSetKey, tokenKey);
        return R.ok();
    }

    @ApiOperation("退出其他所有设备")
    @DeleteMapping("/sessions/other")
    public R<Void> logoutOtherSessions(@RequestHeader(value = "Authorization", required = false) String bearerToken) {
        LoginUser currentUser = (LoginUser) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        String currentToken = parseBearerToken(bearerToken);
        String userTokenSetKey = buildUserTokenSetKey(currentUser.getUserId());
        Set<Object> tokenSet = redisUtils.getSetMembers(userTokenSetKey);
        if (tokenSet != null) {
            for (Object tokenObj : tokenSet) {
                if (tokenObj == null) {
                    continue;
                }
                String tokenKey = String.valueOf(tokenObj);
                if (tokenKey.equals(currentToken)) {
                    continue;
                }
                redisUtils.delete(RedisConstant.TOKEN_PREFIX + tokenKey);
                redisUtils.removeSetMembers(userTokenSetKey, tokenKey);
            }
        }
        return R.ok();
    }

    private String parseBearerToken(String bearerToken) {
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private String buildUserTokenSetKey(Long userId) {
        return RedisConstant.USER_TOKEN_SET_PREFIX + userId;
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // 多级代理时取第一个
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    /** 从 User-Agent 解析浏览器和操作系统 */
    private void parseUserAgent(String ua, LoginUser loginUser) {
        if (ua == null || ua.isEmpty()) {
            loginUser.setBrowser("未知");
            loginUser.setOs("未知");
            return;
        }
        // 解析浏览器
        String browser;
        if (ua.contains("Edg/")) {
            browser = "Edge";
        } else if (ua.contains("Chrome/") && !ua.contains("Edg/")) {
            browser = "Chrome";
        } else if (ua.contains("Firefox/")) {
            browser = "Firefox";
        } else if (ua.contains("Safari/") && !ua.contains("Chrome/")) {
            browser = "Safari";
        } else if (ua.contains("MSIE") || ua.contains("Trident/")) {
            browser = "IE";
        } else if (ua.contains("Opera") || ua.contains("OPR/")) {
            browser = "Opera";
        } else {
            browser = "其他";
        }
        // 解析操作系统
        String os;
        if (ua.contains("Windows")) {
            os = "Windows";
        } else if (ua.contains("Mac OS")) {
            os = "macOS";
        } else if (ua.contains("Android")) {
            os = "Android";
        } else if (ua.contains("iPhone") || ua.contains("iPad")) {
            os = "iOS";
        } else if (ua.contains("Linux")) {
            os = "Linux";
        } else {
            os = "其他";
        }
        loginUser.setBrowser(browser);
        loginUser.setOs(os);
    }
}
