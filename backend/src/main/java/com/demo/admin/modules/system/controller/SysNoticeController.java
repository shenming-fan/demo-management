package com.demo.admin.modules.system.controller;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.demo.admin.common.annotation.OperLog;
import com.demo.admin.common.result.PageResult;
import com.demo.admin.common.result.R;
import com.demo.admin.common.utils.HtmlSanitizer;
import com.demo.admin.modules.system.entity.SysNotice;
import com.demo.admin.modules.system.entity.SysNoticeRead;
import com.demo.admin.modules.system.mapper.SysNoticeMapper;
import com.demo.admin.modules.system.mapper.SysNoticeReadMapper;
import com.demo.admin.security.service.LoginUser;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 通知公告控制器
 */
@Api(tags = "通知公告")
@RestController
@RequestMapping("/system/notice")
public class SysNoticeController {

    @Autowired
    private SysNoticeMapper noticeMapper;

    @Autowired
    private SysNoticeReadMapper noticeReadMapper;

    @Autowired
    private HtmlSanitizer htmlSanitizer;

    /**
     * 获取当前登录用户ID
     */
    private Long getCurrentUserId() {
        LoginUser loginUser = (LoginUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return loginUser.getUserId();
    }

    @ApiOperation("获取最新通知公告（含已读状态）")
    @GetMapping("/latest")
    public R<List<SysNotice>> latest() {
        LambdaQueryWrapper<SysNotice> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysNotice::getStatus, 1)
                .orderByDesc(SysNotice::getCreateTime)
                .last("LIMIT 5");
        List<SysNotice> notices = noticeMapper.selectList(wrapper);

        if (!notices.isEmpty()) {
            Long userId = getCurrentUserId();
            List<Long> noticeIds = notices.stream().map(SysNotice::getId).collect(Collectors.toList());
            LambdaQueryWrapper<SysNoticeRead> readWrapper = new LambdaQueryWrapper<>();
            readWrapper.eq(SysNoticeRead::getUserId, userId)
                    .in(SysNoticeRead::getNoticeId, noticeIds);
            Set<Long> readNoticeIds = noticeReadMapper.selectList(readWrapper).stream()
                    .map(SysNoticeRead::getNoticeId)
                    .collect(Collectors.toSet());
            for (SysNotice notice : notices) {
                sanitizeNoticeContent(notice);
                notice.setRead(readNoticeIds.contains(notice.getId()));
            }
        }

        return R.ok(notices);
    }

    @ApiOperation("获取未读公告数量")
    @GetMapping("/unread-count")
    public R<Long> unreadCount() {
        Long userId = getCurrentUserId();
        // 查询状态正常的公告总数
        LambdaQueryWrapper<SysNotice> noticeWrapper = new LambdaQueryWrapper<>();
        noticeWrapper.eq(SysNotice::getStatus, 1);
        Long totalCount = noticeMapper.selectCount(noticeWrapper);

        // 查询当前用户已读的数量（只统计未删除的公告）
        LambdaQueryWrapper<SysNoticeRead> readWrapper = new LambdaQueryWrapper<>();
        readWrapper.eq(SysNoticeRead::getUserId, userId);
        Long readCount = noticeReadMapper.selectCount(readWrapper);

        long unread = Math.max(0, totalCount - readCount);
        return R.ok(unread);
    }

    @ApiOperation("标记公告为已读")
    @PostMapping("/{id}/read")
    public R<Void> markAsRead(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        // 检查是否已读
        LambdaQueryWrapper<SysNoticeRead> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysNoticeRead::getNoticeId, id)
                .eq(SysNoticeRead::getUserId, userId);
        if (noticeReadMapper.selectCount(wrapper) == 0) {
            SysNoticeRead record = new SysNoticeRead();
            record.setNoticeId(id);
            record.setUserId(userId);
            record.setReadTime(LocalDateTime.now());
            noticeReadMapper.insert(record);
        }
        return R.ok();
    }

    @ApiOperation("分页查询通知公告")
    @GetMapping("/page")
    @PreAuthorize("@ss.hasPermi('system:notice:list')")
    public R<PageResult<SysNotice>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) Integer type,
            @RequestParam(required = false) Integer status) {
        Page<SysNotice> page = new Page<>(current, size);
        LambdaQueryWrapper<SysNotice> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StrUtil.isNotBlank(title), SysNotice::getTitle, title)
                .eq(type != null, SysNotice::getType, type)
                .eq(status != null, SysNotice::getStatus, status)
                .orderByDesc(SysNotice::getCreateTime);
        PageResult<SysNotice> pageResult = PageResult.of(noticeMapper.selectPage(page, wrapper));
        pageResult.getRecords().forEach(this::sanitizeNoticeContent);
        return R.ok(pageResult);
    }

    @ApiOperation("获取公告详情")
    @GetMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:notice:query')")
    public R<SysNotice> getById(@PathVariable Long id) {
        SysNotice notice = noticeMapper.selectById(id);
        sanitizeNoticeContent(notice);
        return R.ok(notice);
    }

    @OperLog("新增通知公告")
    @ApiOperation("新增通知公告")
    @PostMapping
    @PreAuthorize("@ss.hasPermi('system:notice:add')")
    public R<Void> add(@RequestBody SysNotice notice) {
        sanitizeNoticeContent(notice);
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        notice.setCreateBy(username);
        noticeMapper.insert(notice);
        // WebSocket广播新通知
        java.util.Map<String, Object> wsData = new java.util.HashMap<>();
        wsData.put("id", notice.getId());
        wsData.put("title", notice.getTitle());
        wsData.put("type", notice.getType());
        wsData.put("createBy", username);
        com.demo.admin.common.websocket.NoticeWebSocketHandler.broadcast("notice", wsData);
        return R.ok();
    }

    @OperLog("修改通知公告")
    @ApiOperation("修改通知公告")
    @PutMapping
    @PreAuthorize("@ss.hasPermi('system:notice:edit')")
    public R<Void> update(@RequestBody SysNotice notice) {
        sanitizeNoticeContent(notice);
        noticeMapper.updateById(notice);
        return R.ok();
    }

    @OperLog("删除通知公告")
    @ApiOperation("删除通知公告")
    @DeleteMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:notice:delete')")
    public R<Void> delete(@PathVariable Long id) {
        noticeMapper.deleteById(id);
        return R.ok();
    }

    @OperLog("批量删除通知公告")
    @ApiOperation("批量删除通知公告")
    @DeleteMapping("/batch")
    @PreAuthorize("@ss.hasPermi('system:notice:delete')")
    public R<Void> batchDelete(@RequestBody java.util.List<Long> ids) {
        noticeMapper.deleteBatchIds(ids);
        return R.ok();
    }

    private void sanitizeNoticeContent(SysNotice notice) {
        if (notice != null) {
            notice.setContent(htmlSanitizer.sanitize(notice.getContent()));
        }
    }
}
