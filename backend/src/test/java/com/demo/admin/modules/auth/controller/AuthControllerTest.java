package com.demo.admin.modules.auth.controller;

import com.demo.admin.common.constant.RedisConstant;
import com.demo.admin.common.result.R;
import com.demo.admin.common.utils.JwtUtils;
import com.demo.admin.common.utils.RedisUtils;
import com.demo.admin.modules.system.service.SysConfigService;
import com.demo.admin.modules.system.service.SysLoginLogService;
import com.demo.admin.security.service.LoginUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthController 单元测试")
class AuthControllerTest {

    @InjectMocks
    private AuthController authController;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private RedisUtils redisUtils;

    @Mock
    private com.demo.admin.modules.system.service.SysMenuService menuService;

    @Mock
    private com.demo.admin.modules.system.service.SysUserService userService;

    @Mock
    private SysLoginLogService loginLogService;

    @Mock
    private com.demo.admin.modules.system.service.SysFileService fileService;

    @Mock
    private SysConfigService configService;

    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        request = new MockHttpServletRequest();
        request.setRemoteAddr("127.0.0.1");
        request.addHeader("User-Agent", "Mozilla/5.0 Chrome/120");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }

    @Test
    @DisplayName("获取验证码 - 返回key和image")
    void testCaptcha() {
        R<Map<String, String>> result = authController.getCaptcha();

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        assertTrue(result.getData().containsKey("key"));
        assertTrue(result.getData().containsKey("image"));
        // 验证存入了Redis
        verify(redisUtils).set(anyString(), anyString(), eq(RedisConstant.CAPTCHA_EXPIRE), any());
    }

    @Test
    @DisplayName("登录 - 验证码错误")
    void testLogin_WrongCaptcha() {
        when(configService.getConfigByKey("sys.account.captchaEnabled")).thenReturn("true");
        when(redisUtils.get(anyString())).thenReturn("correctCode");

        com.demo.admin.modules.auth.dto.LoginRequest loginRequest = new com.demo.admin.modules.auth.dto.LoginRequest();
        loginRequest.setUsername("admin");
        loginRequest.setPassword("admin123");
        loginRequest.setCaptcha("wrongCode");
        loginRequest.setCaptchaKey("testkey");

        R<?> result = authController.login(loginRequest, request);

        assertEquals(500, result.getCode());
        assertEquals("验证码错误", result.getMessage());
        // 验证码用后即删
        verify(redisUtils).delete(RedisConstant.CAPTCHA_PREFIX + "testkey");
    }

    @Test
    @DisplayName("登录 - 成功")
    void testLogin_Success() {
        // 禁用验证码
        when(configService.getConfigByKey("sys.account.captchaEnabled")).thenReturn("false");
        // 无锁定
        when(redisUtils.get(startsWith("admin:login_fail:"))).thenReturn(null);

        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(1L);
        loginUser.setUsername("admin");
        loginUser.setStatus(1);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(loginUser, null, loginUser.getAuthorities());
        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(jwtUtils.generateToken("admin")).thenReturn("mock-token");
        when(jwtUtils.getExpiration()).thenReturn(86400000L);

        com.demo.admin.modules.auth.dto.LoginRequest loginRequest = new com.demo.admin.modules.auth.dto.LoginRequest();
        loginRequest.setUsername("admin");
        loginRequest.setPassword("admin123");

        R<?> result = authController.login(loginRequest, request);

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        verify(jwtUtils).generateToken("admin");
        // 登录成功清除失败计数
        verify(redisUtils).delete(RedisConstant.LOGIN_FAIL_PREFIX + "admin");
    }
}
