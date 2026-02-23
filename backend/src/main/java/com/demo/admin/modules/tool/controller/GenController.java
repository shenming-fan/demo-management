package com.demo.admin.modules.tool.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.demo.admin.common.result.PageResult;
import com.demo.admin.common.result.R;
import com.demo.admin.modules.tool.entity.GenTable;
import com.demo.admin.modules.tool.service.GenService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * 代码生成控制器
 */
@Api(tags = "代码生成")
@RestController
@RequestMapping("/tool/gen")
public class GenController {

    @Autowired
    private GenService genService;

    @ApiOperation("分页查询已导入的表")
    @GetMapping("/page")
    @PreAuthorize("@ss.hasPermi('tool:gen:list')")
    public R<PageResult<GenTable>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String tableName) {
        Page<GenTable> page = new Page<>(current, size);
        return R.ok(PageResult.of(genService.page(page, tableName)));
    }

    @ApiOperation("查询可导入的数据库表")
    @GetMapping("/db/list")
    @PreAuthorize("@ss.hasPermi('tool:gen:list')")
    public R<List<Map<String, Object>>> dbTableList(
            @RequestParam(required = false) String tableName) {
        return R.ok(genService.selectDbTableList(tableName));
    }

    @ApiOperation("导入表")
    @PostMapping("/import")
    @PreAuthorize("@ss.hasPermi('tool:gen:import')")
    public R<Void> importTables(@RequestBody List<String> tableNames) {
        genService.importTables(tableNames);
        return R.ok();
    }

    @ApiOperation("查询表详情（含列配置）")
    @GetMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('tool:gen:list')")
    public R<GenTable> getById(@PathVariable Long id) {
        return R.ok(genService.getTableWithColumns(id));
    }

    @ApiOperation("更新表及列配置")
    @PutMapping
    @PreAuthorize("@ss.hasPermi('tool:gen:edit')")
    public R<Void> update(@RequestBody GenTable table) {
        genService.updateGenTable(table);
        return R.ok();
    }

    @ApiOperation("删除已导入的表")
    @DeleteMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('tool:gen:delete')")
    public R<Void> delete(@PathVariable Long id) {
        genService.deleteTable(id);
        return R.ok();
    }

    @ApiOperation("预览代码")
    @GetMapping("/preview/{id}")
    @PreAuthorize("@ss.hasPermi('tool:gen:list')")
    public R<Map<String, String>> preview(@PathVariable Long id) {
        return R.ok(genService.previewCode(id));
    }

    @ApiOperation("下载代码")
    @GetMapping("/download/{id}")
    @PreAuthorize("@ss.hasPermi('tool:gen:list')")
    public void download(@PathVariable Long id, HttpServletResponse response) throws IOException {
        byte[] data = genService.downloadCode(id);
        response.setContentType("application/zip");
        response.setHeader("Content-Disposition", "attachment; filename=\"generated-code.zip\"");
        response.setContentLength(data.length);
        response.getOutputStream().write(data);
        response.getOutputStream().flush();
    }
}
