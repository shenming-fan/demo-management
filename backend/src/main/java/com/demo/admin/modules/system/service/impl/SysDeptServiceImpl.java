package com.demo.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.admin.modules.system.entity.SysDept;
import com.demo.admin.modules.system.mapper.SysDeptMapper;
import com.demo.admin.modules.system.service.SysDeptService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 部门 Service 实现
 */
@Service
public class SysDeptServiceImpl extends ServiceImpl<SysDeptMapper, SysDept> implements SysDeptService {

    @Override
    public List<SysDept> buildDeptTree(List<SysDept> depts) {
        List<SysDept> result = new ArrayList<>();
        List<Long> deptIds = depts.stream().map(SysDept::getId).collect(Collectors.toList());

        for (SysDept dept : depts) {
            if (!deptIds.contains(dept.getParentId())) {
                buildChildren(depts, dept);
                result.add(dept);
            }
        }

        if (result.isEmpty()) {
            result = depts;
        }
        return result;
    }

    @Override
    public List<Long> getChildDeptIds(Long deptId) {
        List<Long> result = new ArrayList<>();
        if (deptId == null) return result;
        result.add(deptId);
        List<SysDept> allDepts = list();
        collectChildIds(allDepts, deptId, result);
        return result;
    }

    private void collectChildIds(List<SysDept> allDepts, Long parentId, List<Long> result) {
        for (SysDept dept : allDepts) {
            if (parentId.equals(dept.getParentId())) {
                result.add(dept.getId());
                collectChildIds(allDepts, dept.getId(), result);
            }
        }
    }

    private void buildChildren(List<SysDept> depts, SysDept parent) {
        List<SysDept> children = depts.stream()
                .filter(d -> d.getParentId().equals(parent.getId()))
                .collect(Collectors.toList());
        if (!children.isEmpty()) {
            parent.setChildren(children);
            for (SysDept child : children) {
                buildChildren(depts, child);
            }
        }
    }
}
