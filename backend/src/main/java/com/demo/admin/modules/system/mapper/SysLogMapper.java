package com.demo.admin.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.demo.admin.modules.system.entity.SysLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * 操作日志 Mapper
 */
@Mapper
public interface SysLogMapper extends BaseMapper<SysLog> {

    @Select("SELECT DATE(create_time) AS date, COUNT(*) AS count " +
            "FROM sys_log " +
            "WHERE create_time >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) " +
            "GROUP BY DATE(create_time) ORDER BY date")
    List<Map<String, Object>> selectWeeklyTrend();

    @Select("SELECT operation AS name, COUNT(*) AS value " +
            "FROM sys_log " +
            "WHERE create_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) " +
            "GROUP BY operation ORDER BY value DESC LIMIT 8")
    List<Map<String, Object>> selectOperationDistribution();

    @Select("SELECT HOUR(create_time) AS hour, COUNT(*) AS count " +
            "FROM sys_log " +
            "WHERE DATE(create_time) = CURDATE() " +
            "GROUP BY HOUR(create_time) ORDER BY hour")
    List<Map<String, Object>> selectTodayHourlyTrend();

    @Select("SELECT DATE(create_time) AS date, COUNT(*) AS count " +
            "FROM sys_log " +
            "WHERE create_time >= DATE_SUB(CURDATE(), INTERVAL 29 DAY) " +
            "GROUP BY DATE(create_time) ORDER BY date")
    List<Map<String, Object>> selectMonthlyTrend();
}
