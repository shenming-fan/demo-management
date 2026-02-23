package com.demo.admin.common.service;

import java.io.InputStream;

/**
 * 文件存储服务接口
 * 抽象文件存储操作，后续可切换到 MinIO/OSS 等实现
 */
public interface FileStorageService {

    /**
     * 存储文件
     *
     * @param inputStream    文件输入流
     * @param originalName   原始文件名
     * @param contentType    文件MIME类型
     * @return 存储后的相对路径 (如 2026/02/15/uuid.png)
     */
    String store(InputStream inputStream, String originalName, String contentType);

    /**
     * 删除文件
     *
     * @param filePath 文件相对路径
     * @return 是否删除成功
     */
    boolean delete(String filePath);

    /**
     * 获取文件的绝对路径
     *
     * @param filePath 文件相对路径
     * @return 绝对路径
     */
    String getAbsolutePath(String filePath);

    /**
     * 获取文件访问URL
     *
     * @param filePath 文件相对路径
     * @return 访问URL
     */
    String getUrl(String filePath);
}
