package com.demo.admin.modules.auth.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * 登录响应
 */
@Data
@ApiModel("登录响应")
public class LoginResponse {

    @ApiModelProperty("访问令牌")
    private String token;

    @ApiModelProperty("过期时间（毫秒）")
    private Long expireTime;
}
