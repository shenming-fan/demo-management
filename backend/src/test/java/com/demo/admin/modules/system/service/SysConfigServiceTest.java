package com.demo.admin.modules.system.service;

import com.demo.admin.common.utils.RedisUtils;
import com.demo.admin.modules.system.entity.SysConfig;
import com.demo.admin.modules.system.mapper.SysConfigMapper;
import com.demo.admin.modules.system.service.impl.SysConfigServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SysConfigService 单元测试")
class SysConfigServiceTest {

    @InjectMocks
    private SysConfigServiceImpl configService;

    @Mock
    private SysConfigMapper configMapper;

    @Mock
    private RedisUtils redisUtils;

    @Test
    @DisplayName("根据Key获取参数 - 缓存命中")
    void testGetConfigByKey_CacheHit() {
        when(redisUtils.get("sys_config:site.name")).thenReturn("Demo Admin");

        String result = configService.getConfigByKey("site.name");

        assertEquals("Demo Admin", result);
        verify(redisUtils).get("sys_config:site.name");
        verifyNoInteractions(configMapper);
    }

    @Test
    @DisplayName("根据Key获取参数 - 缓存未命中，DB命中")
    void testGetConfigByKey_CacheMiss_DbHit() {
        when(redisUtils.get("sys_config:site.name")).thenReturn(null);

        SysConfig config = new SysConfig();
        config.setConfigKey("site.name");
        config.setConfigValue("Demo Admin");
        // MyBatis-Plus getOne() 内部调用 selectOne(wrapper, true) 两个参数
        when(configMapper.selectOne(any(), anyBoolean())).thenReturn(config);

        String result = configService.getConfigByKey("site.name");

        assertEquals("Demo Admin", result);
        verify(redisUtils).get("sys_config:site.name");
        verify(redisUtils).set("sys_config:site.name", "Demo Admin");
    }

    @Test
    @DisplayName("根据Key获取参数 - 都未命中返回null")
    void testGetConfigByKey_CacheMiss_DbMiss() {
        when(redisUtils.get("sys_config:nokey")).thenReturn(null);
        when(configMapper.selectOne(any(), anyBoolean())).thenReturn(null);

        String result = configService.getConfigByKey("nokey");

        assertNull(result);
        verify(redisUtils, never()).set(anyString(), any());
    }

    @Test
    @DisplayName("刷新缓存 - 清除旧缓存并重新加载")
    void testRefreshCache() {
        HashSet<String> oldKeys = new HashSet<>(Arrays.asList("sys_config:a", "sys_config:b"));
        when(redisUtils.keys("sys_config:*")).thenReturn(oldKeys);

        SysConfig c1 = new SysConfig();
        c1.setConfigKey("a");
        c1.setConfigValue("v1");
        SysConfig c2 = new SysConfig();
        c2.setConfigKey("b");
        c2.setConfigValue("v2");
        // MyBatis-Plus list() 内部调用 selectList(null)
        when(configMapper.selectList(any())).thenReturn(Arrays.asList(c1, c2));

        configService.refreshCache();

        verify(redisUtils).delete(oldKeys);
        verify(redisUtils).set("sys_config:a", "v1");
        verify(redisUtils).set("sys_config:b", "v2");
    }
}
