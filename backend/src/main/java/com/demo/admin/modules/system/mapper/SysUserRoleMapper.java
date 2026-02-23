package com.demo.admin.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.demo.admin.modules.system.entity.SysUserRole;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 用户角色关联 Mapper
 */
@Mapper
public interface SysUserRoleMapper extends BaseMapper<SysUserRole> {

    /**
     * 根据用户ID删除关联
     */
    int deleteByUserId(@Param("userId") Long userId);

    /**
     * 批量插入用户角色关联
     */
    int batchInsert(@Param("userId") Long userId, @Param("roleIds") List<Long> roleIds);

    /**
     * 根据用户ID查询关联的角色ID列表
     */
    List<Long> selectRoleIdsByUserId(@Param("userId") Long userId);

    /**
     * 根据角色ID查询绑定的用户数量
     */
    int countByRoleId(@Param("roleId") Long roleId);
}
