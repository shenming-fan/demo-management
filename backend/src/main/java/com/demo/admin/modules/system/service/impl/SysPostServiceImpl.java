package com.demo.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.admin.modules.system.entity.SysPost;
import com.demo.admin.modules.system.mapper.SysPostMapper;
import com.demo.admin.modules.system.service.SysPostService;
import org.springframework.stereotype.Service;

/**
 * 岗位 Service 实现
 */
@Service
public class SysPostServiceImpl extends ServiceImpl<SysPostMapper, SysPost> implements SysPostService {
}
