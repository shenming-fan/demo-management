package com.demo.admin.modules.system.controller;

import cn.hutool.core.util.StrUtil;
import cn.hutool.poi.excel.ExcelReader;
import cn.hutool.poi.excel.ExcelUtil;
import cn.hutool.poi.excel.ExcelWriter;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.demo.admin.common.annotation.DataScope;
import com.demo.admin.common.annotation.OperLog;
import com.demo.admin.common.result.PageResult;
import com.demo.admin.common.result.R;
import com.demo.admin.common.utils.DataScopeHelper;
import com.demo.admin.modules.system.entity.SysUser;
import com.demo.admin.modules.system.mapper.SysUserMapper;
import com.demo.admin.modules.system.mapper.SysUserPostMapper;
import com.demo.admin.modules.system.mapper.SysUserRoleMapper;
import com.demo.admin.modules.system.service.SysUserService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 用户管理控制器
 */
@Api(tags = "用户管理")
@RestController
@RequestMapping("/system/user")
public class SysUserController {

    @Autowired
    private SysUserService userService;

    @Autowired
    private SysUserMapper userMapper;

    @Autowired
    private SysUserRoleMapper userRoleMapper;

    @Autowired
    private SysUserPostMapper userPostMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.demo.admin.modules.system.service.SysConfigService configService;

    @ApiOperation("分页查询用户")
    @GetMapping("/page")
    @PreAuthorize("@ss.hasPermi('system:user:list')")
    @DataScope
    public R<PageResult<SysUser>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) Long roleId) {

        List<Long> deptIds = DataScopeHelper.getDeptIds();
        Page<SysUser> page = new Page<>(current, size);
        Page<SysUser> result = (Page<SysUser>) userMapper.selectUserPage(page, username, phone, status, roleId, deptIds);
        result.getRecords().forEach(u -> u.setPassword(null));

        return R.ok(PageResult.of(result));
    }

    @ApiOperation("获取用户详情")
    @GetMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:user:query')")
    public R<SysUser> getById(@PathVariable Long id) {
        SysUser user = userService.getById(id);
        if (user != null) {
            user.setPassword(null);
        }
        return R.ok(user);
    }

    @ApiOperation("创建用户")
    @PostMapping
    @PreAuthorize("@ss.hasPermi('system:user:add')")
    @OperLog("新增用户")
    public R<Void> create(@Valid @RequestBody SysUser user,
                          @RequestParam(required = false) List<Long> roleIds,
                          @RequestParam(required = false) List<Long> postIds) {
        userService.createUser(user, roleIds, postIds);
        return R.ok();
    }

    @ApiOperation("更新用户")
    @PutMapping
    @PreAuthorize("@ss.hasPermi('system:user:edit')")
    @OperLog("修改用户")
    public R<Void> update(@Valid @RequestBody SysUser user,
                          @RequestParam(required = false) List<Long> roleIds,
                          @RequestParam(required = false) List<Long> postIds) {
        userService.updateUser(user, roleIds, postIds);
        return R.ok();
    }

    @ApiOperation("删除用户")
    @DeleteMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('system:user:delete')")
    @OperLog("删除用户")
    public R<Void> delete(@PathVariable Long id) {
        userService.deleteUser(id);
        return R.ok();
    }

    @ApiOperation("批量删除用户")
    @DeleteMapping("/batch")
    @PreAuthorize("@ss.hasPermi('system:user:delete')")
    @OperLog("批量删除用户")
    public R<Void> batchDelete(@RequestBody List<Long> ids) {
        if (ids != null) {
            ids.forEach(userService::deleteUser);
        }
        return R.ok();
    }

    @ApiOperation("重置密码")
    @PutMapping("/{id}/password/reset")
    @PreAuthorize("@ss.hasPermi('system:user:resetPwd')")
    @OperLog("重置用户密码")
    public R<Void> resetPassword(@PathVariable Long id,
                                  @RequestParam String newPassword) {
        userService.resetPassword(id, newPassword);
        return R.ok();
    }

    @ApiOperation("修改状态")
    @PutMapping("/{id}/status")
    @PreAuthorize("@ss.hasPermi('system:user:edit')")
    public R<Void> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        SysUser user = new SysUser();
        user.setId(id);
        user.setStatus(status);
        userService.updateById(user);
        return R.ok();
    }

    @ApiOperation("批量修改状态")
    @PutMapping("/batch/status")
    @PreAuthorize("@ss.hasPermi('system:user:edit')")
    @OperLog("批量修改用户状态")
    public R<Void> batchUpdateStatus(@RequestBody Map<String, Object> params) {
        @SuppressWarnings("unchecked")
        List<Number> ids = (List<Number>) params.get("ids");
        Integer status = ((Number) params.get("status")).intValue();
        if (ids != null) {
            ids.forEach(id -> {
                SysUser user = new SysUser();
                user.setId(id.longValue());
                user.setStatus(status);
                userService.updateById(user);
            });
        }
        return R.ok();
    }

    @ApiOperation("获取用户关联的角色ID列表")
    @GetMapping("/{id}/roles")
    @PreAuthorize("@ss.hasPermi('system:user:query')")
    public R<List<Long>> getUserRoles(@PathVariable Long id) {
        return R.ok(userRoleMapper.selectRoleIdsByUserId(id));
    }

    @ApiOperation("获取用户关联的岗位ID列表")
    @GetMapping("/{id}/posts")
    @PreAuthorize("@ss.hasPermi('system:user:query')")
    public R<List<Long>> getUserPosts(@PathVariable Long id) {
        return R.ok(userPostMapper.selectPostIdsByUserId(id));
    }

    @ApiOperation("导出用户列表")
    @GetMapping("/export")
    @PreAuthorize("@ss.hasPermi('system:user:list')")
    @OperLog("导出用户列表")
    @DataScope
    public void export(HttpServletResponse response,
                       @RequestParam(required = false) String username,
                       @RequestParam(required = false) String phone,
                       @RequestParam(required = false) Integer status,
                       @RequestParam(required = false) Long roleId) throws IOException {
        List<Long> deptIds = DataScopeHelper.getDeptIds();
        Page<SysUser> page = new Page<>(1, Integer.MAX_VALUE);
        Page<SysUser> result = (Page<SysUser>) userMapper.selectUserPage(page, username, phone, status, roleId, deptIds);
        List<SysUser> list = result.getRecords();

        ExcelWriter writer = ExcelUtil.getWriter(true);
        writer.addHeaderAlias("username", "用户名");
        writer.addHeaderAlias("nickname", "昵称");
        writer.addHeaderAlias("deptName", "部门");
        writer.addHeaderAlias("phone", "手机号");
        writer.addHeaderAlias("email", "邮箱");
        writer.addHeaderAlias("gender", "性别");
        writer.addHeaderAlias("status", "状态");
        writer.addHeaderAlias("roleNames", "角色");
        writer.addHeaderAlias("postNames", "岗位");
        writer.addHeaderAlias("createTime", "创建时间");
        writer.setOnlyAlias(true);

        writer.write(list, true);

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8");
        response.setHeader("Content-Disposition", "attachment;filename=" +
                URLEncoder.encode("用户列表.xlsx", StandardCharsets.UTF_8.name()));
        writer.flush(response.getOutputStream(), true);
        writer.close();
    }

    @ApiOperation("下载用户导入模板")
    @GetMapping("/import/template")
    @PreAuthorize("@ss.hasPermi('system:user:add')")
    public void importTemplate(HttpServletResponse response) throws IOException {
        ExcelWriter writer = ExcelUtil.getWriter(true);
        writer.writeHeadRow(java.util.Arrays.asList("用户名", "昵称", "密码", "手机号", "邮箱", "性别(0未知/1男/2女)"));
        // 写一行示例数据
        writer.writeRow(java.util.Arrays.asList("zhangsan", "张三", "123456", "13800138000", "zhangsan@example.com", "1"));

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8");
        response.setHeader("Content-Disposition", "attachment;filename=" +
                URLEncoder.encode("用户导入模板.xlsx", StandardCharsets.UTF_8.name()));
        writer.flush(response.getOutputStream(), true);
        writer.close();
    }

    @ApiOperation("导入用户")
    @PostMapping("/import")
    @PreAuthorize("@ss.hasPermi('system:user:add')")
    @OperLog("导入用户")
    public R<String> importUsers(@RequestParam("file") MultipartFile file) throws IOException {
        ExcelReader reader = ExcelUtil.getReader(file.getInputStream());
        List<Map<String, Object>> rows = reader.readAll();
        int success = 0;
        int fail = 0;
        StringBuilder failMsg = new StringBuilder();

        for (int i = 0; i < rows.size(); i++) {
            try {
                Map<String, Object> row = rows.get(i);
                String username = String.valueOf(row.getOrDefault("用户名", ""));
                String nickname = String.valueOf(row.getOrDefault("昵称", ""));
                String password = String.valueOf(row.getOrDefault("密码", ""));
                if (cn.hutool.core.util.StrUtil.isBlank(password)) {
                    String initPwd = configService.getConfigByKey("sys.account.initPassword");
                    password = cn.hutool.core.util.StrUtil.isNotBlank(initPwd) ? initPwd : "123456";
                }
                String phone = String.valueOf(row.getOrDefault("手机号", ""));
                String email = String.valueOf(row.getOrDefault("邮箱", ""));
                Object genderObj = row.get("性别(0未知/1男/2女)");
                int gender = 0;
                if (genderObj != null) {
                    try { gender = Integer.parseInt(String.valueOf(genderObj)); } catch (Exception e) { /* ignore */ }
                }

                if (StrUtil.isBlank(username)) {
                    fail++;
                    failMsg.append("第").append(i + 2).append("行：用户名为空; ");
                    continue;
                }

                // 检查用户名是否存在
                if (userService.getByUsername(username) != null) {
                    fail++;
                    failMsg.append("第").append(i + 2).append("行：用户名").append(username).append("已存在; ");
                    continue;
                }

                SysUser user = new SysUser();
                user.setUsername(username);
                user.setNickname(StrUtil.isNotBlank(nickname) ? nickname : username);
                user.setPassword(passwordEncoder.encode(password));
                user.setPhone(StrUtil.isNotBlank(phone) ? phone : null);
                user.setEmail(StrUtil.isNotBlank(email) ? email : null);
                user.setGender(gender);
                user.setStatus(1);
                userService.save(user);
                success++;
            } catch (Exception e) {
                fail++;
                failMsg.append("第").append(i + 2).append("行导入失败: ").append(e.getMessage()).append("; ");
            }
        }

        String msg = "导入完成：成功 " + success + " 条";
        if (fail > 0) {
            msg += "，失败 " + fail + " 条。" + failMsg.toString();
        }
        return R.ok(msg, null);
    }
}
