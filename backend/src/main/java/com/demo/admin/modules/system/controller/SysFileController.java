package com.demo.admin.modules.system.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.demo.admin.common.annotation.OperLog;
import com.demo.admin.common.exception.BusinessException;
import com.demo.admin.common.result.PageResult;
import com.demo.admin.common.result.R;
import com.demo.admin.common.result.ResultCode;
import com.demo.admin.common.service.FileStorageService;
import com.demo.admin.modules.system.entity.SysFile;
import com.demo.admin.modules.system.service.SysFileService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * 文件管理控制器
 */
@Api(tags = "文件管理")
@RestController
@RequestMapping("/system/file")
public class SysFileController {

    @Autowired
    private SysFileService fileService;

    @Autowired
    private FileStorageService fileStorageService;

    @ApiOperation("上传文件")
    @PostMapping("/upload")
    @PreAuthorize("@ss.hasPermi('system:file:upload')")
    @OperLog("上传文件")
    public R<SysFile> upload(@RequestParam("file") MultipartFile file) {
        SysFile sysFile = fileService.uploadFile(file);
        return R.ok(sysFile);
    }

    @ApiOperation("分页查询文件")
    @GetMapping("/page")
    @PreAuthorize("@ss.hasPermi('system:file:list')")
    public R<PageResult<SysFile>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String originalName,
            @RequestParam(required = false) String fileType) {

        Page<SysFile> page = new Page<>(current, size);
        LambdaQueryWrapper<SysFile> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(originalName)) {
            wrapper.like(SysFile::getOriginalName, originalName);
        }
        if (StringUtils.hasText(fileType)) {
            wrapper.like(SysFile::getFileType, fileType);
        }
        wrapper.orderByDesc(SysFile::getCreateTime);

        Page<SysFile> result = fileService.page(page, wrapper);
        return R.ok(PageResult.of(result));
    }

    @ApiOperation("下载文件")
    @GetMapping("/download/{id}")
    @PreAuthorize("@ss.hasPermi('system:file:download')")
    public void download(@PathVariable Long id, HttpServletResponse response) throws IOException {
        SysFile sysFile = fileService.getById(id);
        if (sysFile == null) {
            throw new BusinessException(ResultCode.FILE_NOT_FOUND);
        }

        String absolutePath = fileStorageService.getAbsolutePath(sysFile.getFilePath());
        File file = new File(absolutePath);
        if (!file.exists()) {
            throw new BusinessException(ResultCode.FILE_NOT_FOUND, "文件不存在于磁盘");
        }

        response.setContentType("application/octet-stream");
        response.setHeader("Content-Disposition", "attachment;filename=" +
                URLEncoder.encode(sysFile.getOriginalName(), StandardCharsets.UTF_8.name()));
        response.setContentLengthLong(file.length());

        try (FileInputStream fis = new FileInputStream(file);
             OutputStream os = response.getOutputStream()) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = fis.read(buffer)) != -1) {
                os.write(buffer, 0, bytesRead);
            }
            os.flush();
        }
    }

    @ApiOperation("删除文件")
    @DeleteMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:file:delete')")
    @OperLog("删除文件")
    public R<Void> delete(@PathVariable Long id) {
        fileService.deleteFile(id);
        return R.ok();
    }

    @ApiOperation("批量删除文件")
    @DeleteMapping("/batch")
    @PreAuthorize("@ss.hasPermi('system:file:delete')")
    @OperLog("批量删除文件")
    public R<Void> deleteBatch(@RequestBody List<Long> ids) {
        fileService.deleteFileBatch(ids);
        return R.ok();
    }
}
