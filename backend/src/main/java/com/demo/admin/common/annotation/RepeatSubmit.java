package com.demo.admin.common.annotation;

import java.lang.annotation.*;

/**
 * 防重复提交注解
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RepeatSubmit {

    /**
     * 间隔时间（秒），默认3秒内不允许重复提交
     */
    int interval() default 3;

    /**
     * 提示信息
     */
    String message() default "请勿重复提交";
}
