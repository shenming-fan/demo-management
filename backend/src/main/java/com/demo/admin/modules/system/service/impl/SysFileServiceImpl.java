package com.demo.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.admin.common.exception.BusinessException;
import com.demo.admin.common.result.ResultCode;
import com.demo.admin.common.service.FileStorageService;
import com.demo.admin.modules.system.entity.SysFile;
import com.demo.admin.modules.system.mapper.SysFileMapper;
import com.demo.admin.modules.system.service.SysFileService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 系统文件 Service 实现
 */
@Slf4j
@Service
public class SysFileServiceImpl extends ServiceImpl<SysFileMapper, SysFile> implements SysFileService {

    @Autowired
    private FileStorageService fileStorageService;

    /**
     * 允许的文件扩展名
     */
    private static final Set<String> ALLOWED_EXTENSIONS = new HashSet<>(Arrays.asList(
            // 图片
            ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".ico",
            // 文档
            ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".pdf", ".txt", ".csv",
            // 压缩包
            ".zip", ".rar", ".7z", ".tar", ".gz",
            // 其他
            ".json", ".xml", ".sql", ".md"
    ));

    /**
     * 允许的MIME类型前缀
     */
    private static final Set<String> ALLOWED_MIME_PREFIXES = new HashSet<>(Arrays.asList(
            "image/", "text/", "application/pdf",
            "application/msword", "application/vnd.openxmlformats",
            "application/vnd.ms-excel", "application/vnd.ms-powerpoint",
            "application/zip", "application/x-rar", "application/x-7z",
            "application/gzip", "application/json", "application/xml",
            "application/octet-stream", "application/sql"
    ));

    @Override
    public SysFile uploadFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException(ResultCode.FILE_UPLOAD_ERROR, "上传文件不能为空");
        }

        String originalName = file.getOriginalFilename();
        String contentType = file.getContentType();

        // 校验文件扩展名
        String extension = getExtension(originalName).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BusinessException(ResultCode.FILE_UPLOAD_ERROR, "不支持的文件类型: " + extension);
        }

        // 校验MIME类型
        if (contentType != null && !isAllowedMimeType(contentType)) {
            throw new BusinessException(ResultCode.FILE_UPLOAD_ERROR, "不支持的文件MIME类型: " + contentType);
        }

        try {
            // 存储文件
            String filePath = fileStorageService.store(file.getInputStream(), originalName, contentType);
            String url = fileStorageService.getUrl(filePath);

            // 提取存储文件名
            String storedFileName = filePath.substring(filePath.lastIndexOf('/') + 1);

            // 构建文件记录
            SysFile sysFile = new SysFile();
            sysFile.setOriginalName(originalName);
            sysFile.setFileName(storedFileName);
            sysFile.setFilePath(filePath);
            sysFile.setFileSize(file.getSize());
            sysFile.setFileType(contentType);
            sysFile.setUrl(url);
            sysFile.setCreateBy(getCurrentUsername());

            // 入库
            save(sysFile);
            log.info("文件上传成功: {} -> {}", originalName, filePath);

            return sysFile;
        } catch (IOException e) {
            log.error("文件上传失败: {}", originalName, e);
            throw new BusinessException(ResultCode.FILE_UPLOAD_ERROR, "文件上传失败: " + e.getMessage());
        }
    }

    @Override
    public void deleteFile(Long id) {
        SysFile sysFile = getById(id);
        if (sysFile == null) {
            throw new BusinessException(ResultCode.FILE_NOT_FOUND);
        }
        // 删除物理文件
        fileStorageService.delete(sysFile.getFilePath());
        // 逻辑删除数据库记录
        removeById(id);
        log.info("文件删除成功: {}", sysFile.getOriginalName());
    }

    @Override
    public void deleteFileBatch(List<Long> ids) {
        List<SysFile> files = listByIds(ids);
        for (SysFile file : files) {
            fileStorageService.delete(file.getFilePath());
        }
        removeByIds(ids);
        log.info("批量删除文件成功, 数量: {}", ids.size());
    }

    /**
     * 获取当前登录用户名
     */
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        return null;
    }

    /**
     * 检查MIME类型是否允许
     */
    private boolean isAllowedMimeType(String contentType) {
        for (String prefix : ALLOWED_MIME_PREFIXES) {
            if (contentType.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 获取文件扩展名（含点号）
     */
    private String getExtension(String fileName) {
        if (fileName == null) {
            return "";
        }
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex >= 0) {
            return fileName.substring(dotIndex);
        }
        return "";
    }
}
