package com.demo.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.admin.modules.system.entity.SysDictData;
import com.demo.admin.modules.system.mapper.SysDictDataMapper;
import com.demo.admin.modules.system.service.SysDictDataService;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 字典数据 Service 实现
 */
@Service
public class SysDictDataServiceImpl extends ServiceImpl<SysDictDataMapper, SysDictData> implements SysDictDataService {

    @Override
    public List<SysDictData> listByDictType(String dictType) {
        return list(new LambdaQueryWrapper<SysDictData>()
                .eq(SysDictData::getDictType, dictType)
                .eq(SysDictData::getStatus, 1)
                .orderByAsc(SysDictData::getSort));
    }
}
