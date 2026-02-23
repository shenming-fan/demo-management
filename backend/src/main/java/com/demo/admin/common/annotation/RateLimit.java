package com.demo.admin.common.annotation;

import java.lang.annotation.*;
import java.util.concurrent.TimeUnit;

/**
 * 接口限流注解
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RateLimit {

    /**
     * 限流次数
     */
    int count() default 10;

    /**
     * 限流时间窗口（秒）
     */
    int time() default 60;

    /**
     * 提示信息
     */
    String message() default "请求过于频繁，请稍后再试";
}
