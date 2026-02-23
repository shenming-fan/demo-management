package com.demo.admin.modules.system.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.admin.modules.system.entity.SysConfig;

/**
 * 参数配置 Service
 */
public interface SysConfigService extends IService<SysConfig> {

    /**
     * 根据key获取参数值（带Redis缓存）
     */
    String getConfigByKey(String configKey);

    /**
     * 刷新所有参数到Redis缓存
     */
    void refreshCache();
}
