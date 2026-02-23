package com.demo.admin.common.service.impl;

import com.demo.admin.common.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * 本地文件存储实现
 */
@Slf4j
@Service
public class LocalFileStorageService implements FileStorageService {

    @Value("${admin.upload-path:./uploads}")
    private String uploadPath;

    private Path rootLocation;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy/MM/dd");

    @PostConstruct
    public void init() {
        rootLocation = Paths.get(uploadPath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootLocation);
            log.info("文件上传目录初始化完成: {}", rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("无法创建文件上传目录: " + rootLocation, e);
        }
    }

    @Override
    public String store(InputStream inputStream, String originalName, String contentType) {
        // 生成日期子目录
        String datePath = LocalDate.now().format(DATE_FORMATTER);
        // 生成UUID文件名，保留原始扩展名
        String extension = getExtension(originalName);
        String fileName = UUID.randomUUID().toString().replace("-", "") + extension;
        String relativePath = datePath + "/" + fileName;

        try {
            Path targetDir = rootLocation.resolve(datePath);
            Files.createDirectories(targetDir);

            Path targetFile = targetDir.resolve(fileName);
            Files.copy(inputStream, targetFile, StandardCopyOption.REPLACE_EXISTING);

            log.info("文件存储成功: {}", relativePath);
            return relativePath;
        } catch (IOException e) {
            throw new RuntimeException("文件存储失败: " + originalName, e);
        }
    }

    @Override
    public boolean delete(String filePath) {
        try {
            Path file = rootLocation.resolve(filePath).normalize();
            if (Files.exists(file)) {
                Files.delete(file);
                log.info("文件删除成功: {}", filePath);
                return true;
            }
            log.warn("文件不存在: {}", filePath);
            return false;
        } catch (IOException e) {
            log.error("文件删除失败: {}", filePath, e);
            return false;
        }
    }

    @Override
    public String getAbsolutePath(String filePath) {
        return rootLocation.resolve(filePath).normalize().toString();
    }

    @Override
    public String getUrl(String filePath) {
        return "/uploads/" + filePath;
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
            return fileName.substring(dotIndex).toLowerCase();
        }
        return "";
    }
}
