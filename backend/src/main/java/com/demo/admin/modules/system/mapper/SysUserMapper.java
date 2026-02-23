package com.demo.admin.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.demo.admin.modules.system.entity.SysUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 用户 Mapper
 */
@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {

    /**
     * 根据用户名查询用户
     */
    SysUser selectByUsername(@Param("username") String username);

    /**
     * 查询用户的角色编码列表
     */
    List<String> selectRoleCodesByUserId(@Param("userId") Long userId);

    /**
     * 查询用户的权限标识列表
     */
    List<String> selectPermissionsByUserId(@Param("userId") Long userId);

    /**
     * 分页查询用户（关联角色名称）
     */
    IPage<SysUser> selectUserPage(IPage<SysUser> page,
                                  @Param("username") String username,
                                  @Param("phone") String phone,
                                  @Param("status") Integer status,
                                  @Param("roleId") Long roleId,
                                  @Param("deptIds") List<Long> deptIds);
}
