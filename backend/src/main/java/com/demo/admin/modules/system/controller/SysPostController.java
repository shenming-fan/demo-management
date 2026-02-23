package com.demo.admin.modules.system.controller;

import cn.hutool.core.util.StrUtil;
import cn.hutool.poi.excel.ExcelUtil;
import cn.hutool.poi.excel.ExcelWriter;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.demo.admin.common.annotation.OperLog;
import com.demo.admin.common.result.PageResult;
import com.demo.admin.common.result.R;
import com.demo.admin.modules.system.entity.SysPost;
import com.demo.admin.modules.system.service.SysPostService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * 岗位管理控制器
 */
@Api(tags = "岗位管理")
@RestController
@RequestMapping("/system/post")
public class SysPostController {

    @Autowired
    private SysPostService postService;

    @ApiOperation("分页查询岗位")
    @GetMapping("/list")
    @PreAuthorize("@ss.hasPermi('system:post:list')")
    public R<PageResult<SysPost>> list(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String postName,
            @RequestParam(required = false) String postCode,
            @RequestParam(required = false) Integer status) {
        Page<SysPost> page = new Page<>(current, size);
        LambdaQueryWrapper<SysPost> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StrUtil.isNotBlank(postName), SysPost::getPostName, postName)
                .like(StrUtil.isNotBlank(postCode), SysPost::getPostCode, postCode)
                .eq(status != null, SysPost::getStatus, status)
                .orderByAsc(SysPost::getSort);
        return R.ok(PageResult.of(postService.page(page, wrapper)));
    }

    @ApiOperation("获取岗位详情")
    @GetMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:post:list')")
    public R<SysPost> getById(@PathVariable Long id) {
        return R.ok(postService.getById(id));
    }

    @ApiOperation("获取全部岗位（下拉选择用）")
    @GetMapping("/all")
    public R<List<SysPost>> all() {
        return R.ok(postService.list(new LambdaQueryWrapper<SysPost>()
                .eq(SysPost::getStatus, 1)
                .orderByAsc(SysPost::getSort)));
    }

    @ApiOperation("新增岗位")
    @PostMapping
    @PreAuthorize("@ss.hasPermi('system:post:add')")
    @OperLog("新增岗位")
    public R<Void> create(@RequestBody SysPost post) {
        // 检查岗位编码唯一性
        long count = postService.count(new LambdaQueryWrapper<SysPost>()
                .eq(SysPost::getPostCode, post.getPostCode()));
        if (count > 0) {
            return R.fail("岗位编码已存在");
        }
        post.setDeleted(0);
        postService.save(post);
        return R.ok();
    }

    @ApiOperation("修改岗位")
    @PutMapping
    @PreAuthorize("@ss.hasPermi('system:post:edit')")
    @OperLog("修改岗位")
    public R<Void> update(@RequestBody SysPost post) {
        // 检查岗位编码唯一性（排除自身）
        long count = postService.count(new LambdaQueryWrapper<SysPost>()
                .eq(SysPost::getPostCode, post.getPostCode())
                .ne(SysPost::getId, post.getId()));
        if (count > 0) {
            return R.fail("岗位编码已存在");
        }
        postService.updateById(post);
        return R.ok();
    }

    @ApiOperation("删除岗位")
    @DeleteMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:post:delete')")
    @OperLog("删除岗位")
    public R<Void> delete(@PathVariable Long id) {
        postService.removeById(id);
        return R.ok();
    }

    @ApiOperation("批量删除岗位")
    @DeleteMapping("/batch")
    @PreAuthorize("@ss.hasPermi('system:post:delete')")
    @OperLog("批量删除岗位")
    public R<Void> batchDelete(@RequestBody List<Long> ids) {
        postService.removeByIds(ids);
        return R.ok();
    }

    @ApiOperation("导出岗位列表")
    @GetMapping("/export")
    @PreAuthorize("@ss.hasPermi('system:post:list')")
    @OperLog("导出岗位列表")
    public void export(HttpServletResponse response,
                       @RequestParam(required = false) String postName,
                       @RequestParam(required = false) Integer status) throws IOException {
        LambdaQueryWrapper<SysPost> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StrUtil.isNotBlank(postName), SysPost::getPostName, postName)
                .eq(status != null, SysPost::getStatus, status)
                .orderByAsc(SysPost::getSort);
        List<SysPost> list = postService.list(wrapper);

        ExcelWriter writer = ExcelUtil.getWriter(true);
        writer.addHeaderAlias("postCode", "岗位编码");
        writer.addHeaderAlias("postName", "岗位名称");
        writer.addHeaderAlias("sort", "排序");
        writer.addHeaderAlias("status", "状态");
        writer.addHeaderAlias("remark", "备注");
        writer.addHeaderAlias("createTime", "创建时间");
        writer.setOnlyAlias(true);

        writer.write(list, true);

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8");
        response.setHeader("Content-Disposition", "attachment;filename=" +
                URLEncoder.encode("岗位列表.xlsx", StandardCharsets.UTF_8.name()));
        writer.flush(response.getOutputStream(), true);
        writer.close();
    }

    @ApiOperation("批量更新排序")
    @PutMapping("/sort")
    @PreAuthorize("@ss.hasPermi('system:post:edit')")
    @OperLog("岗位排序")
    public R<Void> updateSort(@RequestBody List<Map<String, Object>> sortList) {
        for (Map<String, Object> item : sortList) {
            Long id = Long.valueOf(item.get("id").toString());
            Integer sort = Integer.valueOf(item.get("sort").toString());
            SysPost post = new SysPost();
            post.setId(id);
            post.setSort(sort);
            postService.updateById(post);
        }
        return R.ok();
    }
}
