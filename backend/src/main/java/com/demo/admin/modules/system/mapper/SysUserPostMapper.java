package com.demo.admin.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.demo.admin.modules.system.entity.SysUserPost;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 用户岗位关联 Mapper
 */
@Mapper
public interface SysUserPostMapper extends BaseMapper<SysUserPost> {

    /**
     * 根据用户ID删除关联
     */
    int deleteByUserId(@Param("userId") Long userId);

    /**
     * 批量插入用户岗位关联
     */
    int batchInsert(@Param("userId") Long userId, @Param("postIds") List<Long> postIds);

    /**
     * 根据用户ID查询关联的岗位ID列表
     */
    List<Long> selectPostIdsByUserId(@Param("userId") Long userId);
}
