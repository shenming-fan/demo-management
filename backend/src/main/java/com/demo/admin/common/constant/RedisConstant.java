package com.demo.admin.common.constant;

/**
 * Redis 常量
 */
public class RedisConstant {

    public static final String TOKEN_PREFIX = "admin:token:";
    public static final String USER_TOKEN_SET_PREFIX = "admin:user:tokens:";
    public static final String USER_INFO_PREFIX = "admin:user:info:";
    public static final String USER_PERM_PREFIX = "admin:user:perm:";
    public static final String CAPTCHA_PREFIX = "admin:captcha:";
    public static final String DICT_PREFIX = "admin:dict:";
    public static final String LOGIN_FAIL_PREFIX = "admin:login_fail:";

    public static final long CAPTCHA_EXPIRE = 5;
    public static final long TOKEN_EXPIRE = 86400;
    public static final int LOGIN_MAX_RETRY = 5;
    public static final long LOGIN_LOCK_TIME = 30; // 分钟
}
