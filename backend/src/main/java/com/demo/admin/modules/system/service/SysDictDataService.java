package com.demo.admin.modules.system.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.admin.modules.system.entity.SysDictData;

import java.util.List;

/**
 * 字典数据 Service
 */
public interface SysDictDataService extends IService<SysDictData> {

    /**
     * 根据字典类型查询启用的字典数据
     */
    List<SysDictData> listByDictType(String dictType);
}
