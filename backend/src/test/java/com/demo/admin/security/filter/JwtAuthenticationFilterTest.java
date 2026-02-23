package com.demo.admin.security.filter;

import com.demo.admin.common.constant.RedisConstant;
import com.demo.admin.common.utils.JwtUtils;
import com.demo.admin.common.utils.RedisUtils;
import com.demo.admin.security.service.LoginUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("JwtAuthenticationFilter 单元测试")
class JwtAuthenticationFilterTest {

    @InjectMocks
    private JwtAuthenticationFilter jwtFilter;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private RedisUtils redisUtils;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;
    private MockFilterChain filterChain;

    @BeforeEach
    void setUp() {
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        filterChain = new MockFilterChain();
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("无Authorization头 - 放行，不设置认证")
    void testNoAuthHeader_PassThrough() throws Exception {
        // 不设置 Authorization 头
        when(jwtUtils.getHeader()).thenReturn("Authorization");

        jwtFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    @DisplayName("有效Token - 设置SecurityContext认证信息")
    void testValidToken_SetsAuthentication() throws Exception {
        String token = "valid-jwt-token";
        request.addHeader("Authorization", "Bearer " + token);

        when(jwtUtils.getHeader()).thenReturn("Authorization");
        when(jwtUtils.getPrefix()).thenReturn("Bearer");
        when(jwtUtils.getUsernameFromToken(token)).thenReturn("admin");
        when(jwtUtils.validateToken(token, "admin")).thenReturn(true);

        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(1L);
        loginUser.setUsername("admin");
        loginUser.setStatus(1);
        loginUser.setPermissions(Arrays.asList("system:user:list"));

        when(redisUtils.get(RedisConstant.TOKEN_PREFIX + token, LoginUser.class))
                .thenReturn(loginUser);

        jwtFilter.doFilterInternal(request, response, filterChain);

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        LoginUser principal = (LoginUser) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        assertEquals("admin", principal.getUsername());
        assertEquals(1L, principal.getUserId());
    }

    @Test
    @DisplayName("无效Token（解析失败）- 放行但不设置认证")
    void testInvalidToken_NoAuthentication() throws Exception {
        request.addHeader("Authorization", "Bearer bad-token");

        when(jwtUtils.getHeader()).thenReturn("Authorization");
        when(jwtUtils.getPrefix()).thenReturn("Bearer");
        when(jwtUtils.getUsernameFromToken("bad-token")).thenReturn(null);

        jwtFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    @DisplayName("Token有效但Redis中无用户 - 放行但不设置认证")
    void testValidTokenButNoRedisUser_NoAuthentication() throws Exception {
        String token = "valid-but-expired-session";
        request.addHeader("Authorization", "Bearer " + token);

        when(jwtUtils.getHeader()).thenReturn("Authorization");
        when(jwtUtils.getPrefix()).thenReturn("Bearer");
        when(jwtUtils.getUsernameFromToken(token)).thenReturn("admin");

        // Redis 中没有对应的 LoginUser（已被删除/过期）
        when(redisUtils.get(RedisConstant.TOKEN_PREFIX + token, LoginUser.class))
                .thenReturn(null);

        jwtFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    @DisplayName("非Bearer格式头 - 放行，不设置认证")
    void testNonBearerHeader_PassThrough() throws Exception {
        request.addHeader("Authorization", "Basic dXNlcjpwYXNz");

        when(jwtUtils.getHeader()).thenReturn("Authorization");
        when(jwtUtils.getPrefix()).thenReturn("Bearer");

        jwtFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
}
