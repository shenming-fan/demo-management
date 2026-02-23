package com.demo.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.admin.common.utils.RedisUtils;
import com.demo.admin.modules.system.entity.SysConfig;
import com.demo.admin.modules.system.mapper.SysConfigMapper;
import com.demo.admin.modules.system.service.SysConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 参数配置 Service 实现
 */
@Service
public class SysConfigServiceImpl extends ServiceImpl<SysConfigMapper, SysConfig> implements SysConfigService {

    private static final String CACHE_PREFIX = "sys_config:";

    @Autowired
    private RedisUtils redisUtils;

    @Override
    public String getConfigByKey(String configKey) {
        // 先查Redis缓存
        Object cached = redisUtils.get(CACHE_PREFIX + configKey);
        if (cached != null) {
            return cached.toString();
        }
        // 未命中查DB
        SysConfig config = getOne(new LambdaQueryWrapper<SysConfig>()
                .eq(SysConfig::getConfigKey, configKey));
        if (config != null) {
            // 回填缓存
            redisUtils.set(CACHE_PREFIX + configKey, config.getConfigValue());
            return config.getConfigValue();
        }
        return null;
    }

    @Override
    public void refreshCache() {
        // 清除旧缓存
        java.util.Set<String> keys = redisUtils.keys(CACHE_PREFIX + "*");
        if (keys != null && !keys.isEmpty()) {
            redisUtils.delete(keys);
        }
        // 重新加载所有参数到缓存
        List<SysConfig> list = list();
        for (SysConfig config : list) {
            redisUtils.set(CACHE_PREFIX + config.getConfigKey(), config.getConfigValue());
        }
    }
}
