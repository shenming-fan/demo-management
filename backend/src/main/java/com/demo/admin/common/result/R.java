package com.demo.admin.common.result;

import lombok.Data;

import java.io.Serializable;

/**
 * 统一响应结果
 */
@Data
public class R<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    private int code;
    private String message;
    private T data;
    private long timestamp;

    public R() {
        this.timestamp = System.currentTimeMillis();
    }

    public static <T> R<T> ok() {
        return ok(null);
    }

    public static <T> R<T> ok(T data) {
        R<T> result = new R<>();
        result.setCode(200);
        result.setMessage("操作成功");
        result.setData(data);
        return result;
    }

    public static <T> R<T> ok(String message, T data) {
        R<T> result = new R<>();
        result.setCode(200);
        result.setMessage(message);
        result.setData(data);
        return result;
    }

    public static <T> R<T> fail() {
        return fail("操作失败");
    }

    public static <T> R<T> fail(String message) {
        return fail(500, message);
    }

    public static <T> R<T> fail(int code, String message) {
        R<T> result = new R<>();
        result.setCode(code);
        result.setMessage(message);
        return result;
    }

    public static <T> R<T> fail(ResultCode resultCode) {
        R<T> result = new R<>();
        result.setCode(resultCode.getCode());
        result.setMessage(resultCode.getMessage());
        return result;
    }
}
