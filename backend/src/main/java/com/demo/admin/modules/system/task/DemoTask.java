package com.demo.admin.modules.system.task;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 示例定时任务
 */
@Component("demoTask")
public class DemoTask {

    private static final Logger log = LoggerFactory.getLogger(DemoTask.class);

    /**
     * 无参示例任务
     */
    public void noParams() {
        log.info("执行无参示例任务");
    }

    /**
     * 带参示例任务
     */
    public void withParams(String params) {
        log.info("执行带参示例任务, 参数: {}", params);
    }
}
