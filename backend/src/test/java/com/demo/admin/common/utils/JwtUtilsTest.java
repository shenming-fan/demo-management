package com.demo.admin.common.utils;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("JwtUtils 单元测试")
class JwtUtilsTest {

    private JwtUtils jwtUtils;

    @BeforeEach
    void setUp() throws Exception {
        jwtUtils = new JwtUtils();
        // 通过反射设置 @Value 注入的字段
        setField(jwtUtils, "secret", "testSecretKeyForUnitTestMustBeLongEnough123456");
        setField(jwtUtils, "expiration", 86400000L); // 24小时
        setField(jwtUtils, "header", "Authorization");
        setField(jwtUtils, "prefix", "Bearer");
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    @Test
    @DisplayName("生成Token并解析出用户名")
    void testGenerateAndParseToken() {
        String token = jwtUtils.generateToken("admin");

        assertNotNull(token);
        assertEquals("admin", jwtUtils.getUsernameFromToken(token));
    }

    @Test
    @DisplayName("验证有效Token - 返回true")
    void testValidateToken_Valid() {
        String token = jwtUtils.generateToken("admin");

        assertTrue(jwtUtils.validateToken(token, "admin"));
    }

    @Test
    @DisplayName("验证Token - 用户名不匹配返回false")
    void testValidateToken_WrongUsername() {
        String token = jwtUtils.generateToken("admin");

        assertFalse(jwtUtils.validateToken(token, "other_user"));
    }

    @Test
    @DisplayName("Token未过期 - 返回false")
    void testIsTokenExpired_NotExpired() {
        String token = jwtUtils.generateToken("admin");

        assertFalse(jwtUtils.isTokenExpired(token));
    }

    @Test
    @DisplayName("过期Token - 返回true")
    void testIsTokenExpired_Expired() throws Exception {
        // 设置过期时间为0毫秒（立即过期）
        setField(jwtUtils, "expiration", 0L);
        String token = jwtUtils.generateToken("admin");
        // 等待一下确保过期
        Thread.sleep(100);

        assertTrue(jwtUtils.isTokenExpired(token));
    }

    @Test
    @DisplayName("非法Token - 解析返回null")
    void testGetUsernameFromToken_InvalidToken() {
        String username = jwtUtils.getUsernameFromToken("invalid.token.string");

        assertNull(username);
    }

    @Test
    @DisplayName("刷新Token - 生成新Token")
    void testRefreshToken() {
        String originalToken = jwtUtils.generateToken("admin");
        String refreshedToken = jwtUtils.refreshToken(originalToken);

        assertNotNull(refreshedToken);
        assertNotEquals(originalToken, refreshedToken);
        assertEquals("admin", jwtUtils.getUsernameFromToken(refreshedToken));
    }

    @Test
    @DisplayName("非法Token刷新 - 返回null")
    void testRefreshToken_InvalidToken() {
        String result = jwtUtils.refreshToken("invalid.token");

        assertNull(result);
    }

    @Test
    @DisplayName("getter方法返回正确值")
    void testGetters() {
        assertEquals("Authorization", jwtUtils.getHeader());
        assertEquals("Bearer", jwtUtils.getPrefix());
        assertEquals(86400000L, jwtUtils.getExpiration());
    }
}
