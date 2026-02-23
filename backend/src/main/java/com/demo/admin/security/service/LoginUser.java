package com.demo.admin.security.service;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 登录用户信息
 */
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class LoginUser implements UserDetails {

    private static final long serialVersionUID = 1L;

    private Long userId;
    private Long deptId;
    private String username;
    @JsonIgnore
    private String password;
    private String nickname;
    private String avatar;
    private Integer status;
    private List<String> roles = new ArrayList<>();
    private List<String> permissions = new ArrayList<>();

    /** 设备信息 - 登录时记录 */
    private String loginIp;
    private String browser;
    private String os;
    private Long loginTime;
    private String tokenKey;

    public LoginUser(Long userId, Long deptId, String username, String password, String nickname,
                     String avatar, Integer status, List<String> roles, List<String> permissions) {
        this.userId = userId;
        this.deptId = deptId;
        this.username = username;
        this.password = password;
        this.nickname = nickname;
        this.avatar = avatar;
        this.status = status;
        this.roles = roles != null ? roles : new ArrayList<>();
        this.permissions = permissions != null ? permissions : new ArrayList<>();
    }

    @Override
    @JsonIgnore
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return permissions.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    @JsonIgnore
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    @JsonIgnore
    public boolean isEnabled() {
        return status != null && status == 1;
    }
}
