package com.demo.admin.security.filter;

import com.demo.admin.common.constant.RedisConstant;
import com.demo.admin.common.utils.JwtUtils;
import com.demo.admin.common.utils.RedisUtils;
import com.demo.admin.security.service.LoginUser;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * JWT 认证过滤器
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private RedisUtils redisUtils;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        // 获取Token
        String token = getToken(request);
        if (StringUtils.isNotBlank(token)) {
            // 从Token中获取用户名
            String username = jwtUtils.getUsernameFromToken(token);
            if (StringUtils.isNotBlank(username) && SecurityContextHolder.getContext().getAuthentication() == null) {
                // 从Redis获取用户信息
                LoginUser loginUser = redisUtils.get(RedisConstant.TOKEN_PREFIX + token, LoginUser.class);
                if (loginUser != null && jwtUtils.validateToken(token, username)) {
                    // 设置认证信息
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(loginUser, null, loginUser.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        }
        filterChain.doFilter(request, response);
    }

    /**
     * 从请求头获取Token
     */
    private String getToken(HttpServletRequest request) {
        String bearerToken = request.getHeader(jwtUtils.getHeader());
        if (StringUtils.isNotBlank(bearerToken) && bearerToken.startsWith(jwtUtils.getPrefix() + " ")) {
            return bearerToken.substring(jwtUtils.getPrefix().length() + 1);
        }
        return null;
    }
}
