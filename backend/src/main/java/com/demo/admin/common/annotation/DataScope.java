package com.demo.admin.common.annotation;

import java.lang.annotation.*;

/**
 * 数据权限注解 - 按部门过滤数据
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface DataScope {

    /**
     * 部门表别名
     */
    String deptAlias() default "";

    /**
     * 用户表别名
     */
    String userAlias() default "";
}
