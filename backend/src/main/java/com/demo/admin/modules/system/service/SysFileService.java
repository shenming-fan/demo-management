package com.demo.admin.modules.system.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.admin.modules.system.entity.SysFile;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 系统文件 Service
 */
public interface SysFileService extends IService<SysFile> {

    /**
     * 上传文件
     *
     * @param file 上传的文件
     * @return 文件记录
     */
    SysFile uploadFile(MultipartFile file);

    /**
     * 删除文件（物理文件 + 逻辑删除记录）
     *
     * @param id 文件ID
     */
    void deleteFile(Long id);

    /**
     * 批量删除文件
     *
     * @param ids 文件ID列表
     */
    void deleteFileBatch(List<Long> ids);
}
