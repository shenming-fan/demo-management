package com.demo.admin.common.result;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 响应状态码
 */
@Getter
@AllArgsConstructor
public enum ResultCode {

    SUCCESS(200, "操作成功"),
    FAIL(500, "操作失败"),

    // 认证相关 401xx
    UNAUTHORIZED(401, "未登录或登录已过期"),
    TOKEN_INVALID(40101, "Token无效"),
    TOKEN_EXPIRED(40102, "Token已过期"),

    // 权限相关 403xx
    FORBIDDEN(403, "没有操作权限"),

    // 参数相关 400xx
    BAD_REQUEST(400, "请求参数错误"),
    VALIDATE_FAILED(40001, "参数校验失败"),

    // 业务相关 500xx
    USER_NOT_FOUND(50001, "用户不存在"),
    PASSWORD_ERROR(50002, "密码错误"),
    USER_DISABLED(50003, "用户已被禁用"),
    USER_EXISTS(50004, "用户名已存在"),
    CAPTCHA_ERROR(50005, "验证码错误"),
    OLD_PASSWORD_ERROR(50006, "旧密码错误"),
    ROLE_HAS_USERS(50007, "该角色已分配给用户，请先解除绑定"),
    ROLE_IDS_REQUIRED(50008, "请至少选择一个角色"),

    // 系统相关 600xx
    SYSTEM_ERROR(600, "系统异常"),
    FILE_UPLOAD_ERROR(60001, "文件上传失败"),
    FILE_NOT_FOUND(60002, "文件不存在");

    private final int code;
    private final String message;
}
