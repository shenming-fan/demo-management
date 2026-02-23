package com.demo.admin;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 后台管理系统启动类
 */
@SpringBootApplication
@MapperScan("com.demo.admin.modules.*.mapper")
@EnableAsync
@EnableScheduling
public class AdminApplication {

    public static void main(String[] args) {
        SpringApplication.run(AdminApplication.class, args);
        System.out.println("===========================================");
        System.out.println("  后台管理系统启动成功!");
        System.out.println("  API文档: http://localhost:8080/api/doc.html");
        System.out.println("===========================================");
    }
}
