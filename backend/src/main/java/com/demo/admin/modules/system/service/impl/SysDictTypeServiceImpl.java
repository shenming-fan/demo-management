package com.demo.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.admin.modules.system.entity.SysDictType;
import com.demo.admin.modules.system.mapper.SysDictTypeMapper;
import com.demo.admin.modules.system.service.SysDictTypeService;
import org.springframework.stereotype.Service;

/**
 * 字典类型 Service 实现
 */
@Service
public class SysDictTypeServiceImpl extends ServiceImpl<SysDictTypeMapper, SysDictType> implements SysDictTypeService {
}
