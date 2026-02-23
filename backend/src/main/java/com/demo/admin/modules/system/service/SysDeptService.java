package com.demo.admin.modules.system.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.admin.modules.system.entity.SysDept;

import java.util.List;

/**
 * 部门 Service
 */
public interface SysDeptService extends IService<SysDept> {

    /**
     * 构建部门树
     */
    List<SysDept> buildDeptTree(List<SysDept> depts);

    /**
     * 获取指定部门及所有子部门ID列表
     */
    List<Long> getChildDeptIds(Long deptId);
}
