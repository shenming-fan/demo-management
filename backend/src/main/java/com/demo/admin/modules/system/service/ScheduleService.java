package com.demo.admin.modules.system.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.demo.admin.modules.system.entity.SysJob;
import com.demo.admin.modules.system.entity.SysJobLog;
import com.demo.admin.modules.system.mapper.SysJobLogMapper;
import com.demo.admin.modules.system.mapper.SysJobMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

/**
 * 定时任务调度服务
 */
@Service
public class ScheduleService {

    private static final Logger log = LoggerFactory.getLogger(ScheduleService.class);

    @Autowired
    private SysJobMapper jobMapper;

    @Autowired
    private SysJobLogMapper jobLogMapper;

    @Autowired
    private ApplicationContext applicationContext;

    private final ThreadPoolTaskScheduler taskScheduler;
    private final Map<Long, ScheduledFuture<?>> runningTasks = new ConcurrentHashMap<>();

    public ScheduleService() {
        taskScheduler = new ThreadPoolTaskScheduler();
        taskScheduler.setPoolSize(10);
        taskScheduler.setThreadNamePrefix("schedule-");
        taskScheduler.setWaitForTasksToCompleteOnShutdown(true);
        taskScheduler.initialize();
    }

    /**
     * 应用启动时加载所有运行中的任务
     */
    @PostConstruct
    public void init() {
        LambdaQueryWrapper<SysJob> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysJob::getStatus, 1);
        List<SysJob> jobs = jobMapper.selectList(wrapper);
        for (SysJob job : jobs) {
            try {
                addTask(job);
            } catch (Exception e) {
                log.error("初始化定时任务失败: {}", job.getJobName(), e);
            }
        }
        log.info("定时任务初始化完成, 共加载 {} 个任务", jobs.size());
    }

    /**
     * 添加并启动任务
     */
    public void addTask(SysJob job) {
        Runnable runnable = createRunnable(job);
        CronTrigger trigger = new CronTrigger(job.getCronExpression());
        ScheduledFuture<?> future = taskScheduler.schedule(runnable, trigger);
        runningTasks.put(job.getId(), future);
    }

    /**
     * 移除任务
     */
    public void removeTask(Long jobId) {
        ScheduledFuture<?> future = runningTasks.remove(jobId);
        if (future != null) {
            future.cancel(false);
        }
    }

    /**
     * 暂停任务
     */
    public void pauseTask(SysJob job) {
        removeTask(job.getId());
        job.setStatus(0);
        jobMapper.updateById(job);
    }

    /**
     * 恢复任务
     */
    public void resumeTask(SysJob job) {
        job.setStatus(1);
        jobMapper.updateById(job);
        addTask(job);
    }

    /**
     * 立即执行一次
     */
    public void runOnce(SysJob job) {
        Runnable runnable = createRunnable(job);
        taskScheduler.execute(runnable);
    }

    /**
     * 更新任务（先移除再添加）
     */
    public void updateTask(SysJob job) {
        removeTask(job.getId());
        jobMapper.updateById(job);
        if (job.getStatus() != null && job.getStatus() == 1) {
            addTask(job);
        }
    }

    /**
     * 创建可执行的Runnable
     */
    private Runnable createRunnable(SysJob job) {
        return () -> {
            long startTime = System.currentTimeMillis();
            SysJobLog jobLog = new SysJobLog();
            jobLog.setJobId(job.getId());
            jobLog.setJobName(job.getJobName());
            jobLog.setBeanName(job.getBeanName());
            jobLog.setMethodName(job.getMethodName());
            jobLog.setParams(job.getParams());
            jobLog.setCreateTime(LocalDateTime.now());

            try {
                Object bean = applicationContext.getBean(job.getBeanName());
                Method method;
                if (job.getParams() != null && !job.getParams().isEmpty()) {
                    method = bean.getClass().getMethod(job.getMethodName(), String.class);
                    method.invoke(bean, job.getParams());
                } else {
                    method = bean.getClass().getMethod(job.getMethodName());
                    method.invoke(bean);
                }
                jobLog.setStatus(1);
                jobLog.setMessage("执行成功");
            } catch (Exception e) {
                jobLog.setStatus(0);
                String msg = e.getCause() != null ? e.getCause().getMessage() : e.getMessage();
                jobLog.setMessage(msg != null && msg.length() > 2000 ? msg.substring(0, 2000) : msg);
                log.error("定时任务执行失败: {}", job.getJobName(), e);
            } finally {
                jobLog.setDuration(System.currentTimeMillis() - startTime);
                jobLogMapper.insert(jobLog);
            }
        };
    }
}
