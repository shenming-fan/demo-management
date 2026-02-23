-- ===============================================
-- 后台管理系统数据库初始化脚本
-- 数据库: demo_admin
-- ===============================================

SET NAMES utf8mb4;

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `demo_admin` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE `demo_admin`;

-- -----------------------------------------------
-- 岗位表
-- -----------------------------------------------
DROP TABLE IF EXISTS `sys_post`;
CREATE TABLE `sys_post` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '岗位ID',
    `post_code` VARCHAR(64) NOT NULL COMMENT '岗位编码',
    `post_name` VARCHAR(50) NOT NULL COMMENT '岗位名称',
    `sort` INT DEFAULT 0 COMMENT '排序',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '删除标志：0-未删除，1-已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_post_code` (`post_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='岗位表';

-- -----------------------------------------------
-- 用户岗位关联表
-- -----------------------------------------------
DROP TABLE IF EXISTS `sys_user_post`;
CREATE TABLE `sys_user_post` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `post_id` BIGINT NOT NULL COMMENT '岗位ID',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_post_id` (`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户岗位关联表';

-- -----------------------------------------------
-- 参数配置表
-- -----------------------------------------------
DROP TABLE IF EXISTS `sys_config`;
CREATE TABLE `sys_config` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '参数ID',
    `config_name` VARCHAR(100) NOT NULL COMMENT '参数名称',
    `config_key` VARCHAR(100) NOT NULL COMMENT '参数键名',
    `config_value` VARCHAR(500) DEFAULT '' COMMENT '参数键值',
    `config_type` TINYINT DEFAULT 1 COMMENT '类型：0-系统内置，1-自定义',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '删除标志：0-未删除，1-已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='参数配置表';

-- -----------------------------------------------
-- 用户表
-- -----------------------------------------------
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    `username` VARCHAR(50) NOT NULL COMMENT '用户名',
    `password` VARCHAR(100) NOT NULL COMMENT '密码',
    `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像',
    `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    `gender` TINYINT DEFAULT 0 COMMENT '性别：0-未知，1-男，2-女',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
    `dept_id` BIGINT DEFAULT NULL COMMENT '部门ID',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `login_ip` VARCHAR(50) DEFAULT NULL COMMENT '最后登录IP',
    `login_time` DATETIME DEFAULT NULL COMMENT '最后登录时间',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by` VARCHAR(50) DEFAULT NULL COMMENT '创建人',
    `update_by` VARCHAR(50) DEFAULT NULL COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '删除标志：0-未删除，1-已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- -----------------------------------------------
-- 角色表
-- -----------------------------------------------
DROP TABLE IF EXISTS `sys_role`;
CREATE TABLE `sys_role` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '角色ID',
    `name` VARCHAR(50) NOT NULL COMMENT '角色名称',
    `code` VARCHAR(50) NOT NULL COMMENT '角色编码',
    `sort` INT DEFAULT 0 COMMENT '排序',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '删除标志：0-未删除，1-已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- -----------------------------------------------
-- 菜单表
-- -----------------------------------------------
DROP TABLE IF EXISTS `sys_menu`;
CREATE TABLE `sys_menu` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '菜单ID',
    `parent_id` BIGINT DEFAULT 0 COMMENT '父级ID',
    `name` VARCHAR(50) NOT NULL COMMENT '菜单名称',
    `type` TINYINT DEFAULT 1 COMMENT '菜单类型：1-目录，2-菜单，3-按钮',
    `path` VARCHAR(200) DEFAULT NULL COMMENT '路由路径',
    `component` VARCHAR(200) DEFAULT NULL COMMENT '组件路径',
    `permission` VARCHAR(100) DEFAULT NULL COMMENT '权限标识',
    `icon` VARCHAR(100) DEFAULT NULL COMMENT '图标',
    `sort` INT DEFAULT 0 COMMENT '排序',
    `visible` TINYINT DEFAULT 1 COMMENT '是否可见：0-隐藏，1-显示',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
    `is_frame` TINYINT DEFAULT 0 COMMENT '是否外链：0-否，1-是',
    `is_cache` TINYINT DEFAULT 1 COMMENT '是否缓存：0-否，1-是',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '删除标志：0-未删除，1-已删除',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜单表';

-- -----------------------------------------------
-- 用户角色关联表
-- -----------------------------------------------
DROP TABLE IF EXISTS `sys_user_role`;
CREATE TABLE `sys_user_role` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `role_id` BIGINT NOT NULL COMMENT '角色ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_role` (`user_id`, `role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

-- -----------------------------------------------
-- 角色菜单关联表
-- -----------------------------------------------
DROP TABLE IF EXISTS `sys_role_menu`;
CREATE TABLE `sys_role_menu` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
    `role_id` BIGINT NOT NULL COMMENT '角色ID',
    `menu_id` BIGINT NOT NULL COMMENT '菜单ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_role_menu` (`role_id`, `menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色菜单关联表';

-- -----------------------------------------------
-- 操作日志表
-- -----------------------------------------------
DROP TABLE IF EXISTS `sys_log`;
CREATE TABLE `sys_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '日志ID',
    `username` VARCHAR(50) DEFAULT NULL COMMENT '操作用户',
    `operation` VARCHAR(50) DEFAULT NULL COMMENT '操作类型',
    `method` VARCHAR(200) DEFAULT NULL COMMENT '请求方法',
    `params` TEXT DEFAULT NULL COMMENT '请求参数',
    `time` BIGINT DEFAULT NULL COMMENT '执行时长(毫秒)',
    `ip` VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
    `status` TINYINT DEFAULT 1 COMMENT '操作状态：0-失败，1-成功',
    `error_msg` VARCHAR(2000) DEFAULT NULL COMMENT '错误信息',
    `response_body` VARCHAR(2000) DEFAULT NULL COMMENT '响应结果',
    `old_value` TEXT DEFAULT NULL COMMENT '变更前数据',
    `new_value` TEXT DEFAULT NULL COMMENT '变更后数据',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- -----------------------------------------------
-- 字典类型表
-- -----------------------------------------------
DROP TABLE IF EXISTS `sys_dict_type`;
CREATE TABLE `sys_dict_type` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '字典类型ID',
    `name` VARCHAR(100) NOT NULL COMMENT '字典名称',
    `type` VARCHAR(100) NOT NULL COMMENT '字典类型',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '删除标志：0-未删除，1-已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='字典类型表';

-- -----------------------------------------------
-- 字典数据表
-- -----------------------------------------------
DROP TABLE IF EXISTS `sys_dict_data`;
CREATE TABLE `sys_dict_data` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '字典数据ID',
    `dict_type` VARCHAR(100) NOT NULL COMMENT '字典类型',
    `label` VARCHAR(100) NOT NULL COMMENT '字典标签',
    `value` VARCHAR(100) NOT NULL COMMENT '字典值',
    `sort` INT DEFAULT 0 COMMENT '排序',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '删除标志：0-未删除，1-已删除',
    PRIMARY KEY (`id`),
    KEY `idx_dict_type` (`dict_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='字典数据表';

-- -----------------------------------------------
-- 部门表
-- -----------------------------------------------
DROP TABLE IF EXISTS `sys_dept`;
CREATE TABLE `sys_dept` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '部门ID',
    `parent_id` BIGINT DEFAULT 0 COMMENT '父级ID',
    `name` VARCHAR(50) NOT NULL COMMENT '部门名称',
    `sort` INT DEFAULT 0 COMMENT '排序',
    `leader` VARCHAR(50) DEFAULT NULL COMMENT '负责人',
    `phone` VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '删除标志：0-未删除，1-已删除',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门表';

-- -----------------------------------------------
-- 登录日志表
-- -----------------------------------------------
DROP TABLE IF EXISTS `sys_login_log`;
CREATE TABLE `sys_login_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '日志ID',
    `username` VARCHAR(50) DEFAULT NULL COMMENT '登录用户',
    `status` TINYINT DEFAULT 1 COMMENT '登录状态：0-失败，1-成功',
    `ip` VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
    `message` VARCHAR(255) DEFAULT NULL COMMENT '提示消息',
    `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '浏览器UA',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
    PRIMARY KEY (`id`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='登录日志表';

-- -----------------------------------------------
-- 代码生成 - 表信息
-- -----------------------------------------------
DROP TABLE IF EXISTS `gen_table`;
CREATE TABLE `gen_table` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '表ID',
    `table_name` VARCHAR(200) NOT NULL COMMENT '表名称',
    `table_comment` VARCHAR(500) DEFAULT '' COMMENT '表描述',
    `class_name` VARCHAR(200) NOT NULL COMMENT '实体类名',
    `package_name` VARCHAR(200) DEFAULT 'com.demo.admin' COMMENT '生成包路径',
    `module_name` VARCHAR(50) DEFAULT NULL COMMENT '模块名',
    `business_name` VARCHAR(50) DEFAULT NULL COMMENT '业务名',
    `function_name` VARCHAR(100) DEFAULT NULL COMMENT '功能名称',
    `author` VARCHAR(50) DEFAULT 'admin' COMMENT '作者',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_table_name` (`table_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='代码生成-表信息';

-- -----------------------------------------------
-- 代码生成 - 列信息
-- -----------------------------------------------
DROP TABLE IF EXISTS `gen_table_column`;
CREATE TABLE `gen_table_column` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '列ID',
    `table_id` BIGINT NOT NULL COMMENT '所属表ID',
    `column_name` VARCHAR(200) NOT NULL COMMENT '列名称',
    `column_comment` VARCHAR(500) DEFAULT '' COMMENT '列描述',
    `column_type` VARCHAR(100) NOT NULL COMMENT '列类型',
    `java_type` VARCHAR(100) DEFAULT NULL COMMENT 'Java类型',
    `java_field` VARCHAR(200) DEFAULT NULL COMMENT 'Java字段名',
    `ts_type` VARCHAR(50) DEFAULT NULL COMMENT 'TypeScript类型',
    `is_pk` TINYINT DEFAULT 0 COMMENT '是否主键：0-否，1-是',
    `is_required` TINYINT DEFAULT 0 COMMENT '是否必填：0-否，1-是',
    `is_list` TINYINT DEFAULT 1 COMMENT '是否列表显示：0-否，1-是',
    `is_query` TINYINT DEFAULT 0 COMMENT '是否查询条件：0-否，1-是',
    `query_type` VARCHAR(20) DEFAULT 'EQ' COMMENT '查询方式：EQ/LIKE/BETWEEN',
    `is_edit` TINYINT DEFAULT 1 COMMENT '是否编辑字段：0-否，1-是',
    `html_type` VARCHAR(50) DEFAULT 'input' COMMENT '表单组件：input/select/radio/datetime/textarea',
    `dict_type` VARCHAR(100) DEFAULT '' COMMENT '字典类型',
    `sort` INT DEFAULT 0 COMMENT '排序',
    PRIMARY KEY (`id`),
    KEY `idx_table_id` (`table_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='代码生成-列信息';

-- -----------------------------------------------
-- 通知公告表
-- -----------------------------------------------
DROP TABLE IF EXISTS `sys_notice`;
CREATE TABLE `sys_notice` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '公告ID',
    `title` VARCHAR(100) NOT NULL COMMENT '公告标题',
    `type` TINYINT NOT NULL COMMENT '公告类型：1-通知，2-公告',
    `content` TEXT DEFAULT NULL COMMENT '公告内容',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0-关闭，1-正常',
    `create_by` VARCHAR(50) DEFAULT NULL COMMENT '创建人',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '删除标志：0-未删除，1-已删除',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知公告表';

-- -----------------------------------------------
-- 公告已读记录表
-- -----------------------------------------------
DROP TABLE IF EXISTS `sys_notice_read`;
CREATE TABLE `sys_notice_read` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    `notice_id` BIGINT NOT NULL COMMENT '公告ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `read_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '阅读时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_notice_user` (`notice_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公告已读记录表';

-- -----------------------------------------------
-- 定时任务表
-- -----------------------------------------------
DROP TABLE IF EXISTS `sys_job`;
CREATE TABLE `sys_job` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '任务ID',
    `job_name` VARCHAR(100) NOT NULL COMMENT '任务名称',
    `job_group` VARCHAR(50) DEFAULT 'DEFAULT' COMMENT '任务组名',
    `cron_expression` VARCHAR(100) NOT NULL COMMENT 'Cron表达式',
    `bean_name` VARCHAR(200) NOT NULL COMMENT '调用目标Bean',
    `method_name` VARCHAR(100) NOT NULL COMMENT '调用方法名',
    `params` VARCHAR(500) DEFAULT NULL COMMENT '方法参数',
    `status` TINYINT DEFAULT 0 COMMENT '状态：0-暂停，1-运行',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '删除标志：0-未删除，1-已删除',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='定时任务表';

-- -----------------------------------------------
-- 定时任务日志表
-- -----------------------------------------------
DROP TABLE IF EXISTS `sys_job_log`;
CREATE TABLE `sys_job_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '日志ID',
    `job_id` BIGINT NOT NULL COMMENT '任务ID',
    `job_name` VARCHAR(100) DEFAULT NULL COMMENT '任务名称',
    `bean_name` VARCHAR(200) DEFAULT NULL COMMENT '调用目标',
    `method_name` VARCHAR(100) DEFAULT NULL COMMENT '调用方法',
    `params` VARCHAR(500) DEFAULT NULL COMMENT '方法参数',
    `status` TINYINT DEFAULT 1 COMMENT '执行状态：0-失败，1-成功',
    `message` VARCHAR(2000) DEFAULT NULL COMMENT '执行信息',
    `duration` BIGINT DEFAULT 0 COMMENT '执行时长(毫秒)',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '执行时间',
    PRIMARY KEY (`id`),
    KEY `idx_job_id` (`job_id`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='定时任务日志表';

-- -----------------------------------------------
-- 文件表
-- -----------------------------------------------
DROP TABLE IF EXISTS `sys_file`;
CREATE TABLE `sys_file` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '文件ID',
    `original_name` VARCHAR(255) NOT NULL COMMENT '原始文件名',
    `file_name` VARCHAR(255) NOT NULL COMMENT '存储文件名',
    `file_path` VARCHAR(500) NOT NULL COMMENT '文件存储路径',
    `file_size` BIGINT DEFAULT 0 COMMENT '文件大小(字节)',
    `file_type` VARCHAR(100) DEFAULT NULL COMMENT '文件MIME类型',
    `url` VARCHAR(500) DEFAULT NULL COMMENT '文件访问URL',
    `create_by` VARCHAR(64) DEFAULT NULL COMMENT '上传人',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '删除标志：0-未删除，1-已删除',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统文件表';

-- ===============================================
-- 初始化数据
-- ===============================================

-- 初始化管理员用户 (密码: admin123)
INSERT INTO `sys_user` (`username`, `password`, `nickname`, `status`) VALUES
('admin', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '超级管理员', 1);

-- 初始化角色
INSERT INTO `sys_role` (`name`, `code`, `sort`, `status`) VALUES
('超级管理员', 'admin', 1, 1),
('普通用户', 'user', 2, 1);

-- 初始化菜单
INSERT INTO `sys_menu` (`parent_id`, `name`, `type`, `path`, `component`, `permission`, `icon`, `sort`, `visible`, `status`) VALUES
-- 系统管理
(0, '系统管理', 1, '/system', NULL, NULL, 'setting', 1, 1, 1),
-- 用户管理
(1, '用户管理', 2, '/system/user', 'system/user/index', 'system:user:list', 'user', 1, 1, 1),
(2, '用户查询', 3, NULL, NULL, 'system:user:query', NULL, 1, 1, 1),
(2, '用户新增', 3, NULL, NULL, 'system:user:add', NULL, 2, 1, 1),
(2, '用户修改', 3, NULL, NULL, 'system:user:edit', NULL, 3, 1, 1),
(2, '用户删除', 3, NULL, NULL, 'system:user:delete', NULL, 4, 1, 1),
(2, '重置密码', 3, NULL, NULL, 'system:user:resetPwd', NULL, 5, 1, 1),
-- 角色管理
(1, '角色管理', 2, '/system/role', 'system/role/index', 'system:role:list', 'peoples', 2, 1, 1),
(8, '角色查询', 3, NULL, NULL, 'system:role:query', NULL, 1, 1, 1),
(8, '角色新增', 3, NULL, NULL, 'system:role:add', NULL, 2, 1, 1),
(8, '角色修改', 3, NULL, NULL, 'system:role:edit', NULL, 3, 1, 1),
(8, '角色删除', 3, NULL, NULL, 'system:role:delete', NULL, 4, 1, 1),
-- 菜单管理
(1, '菜单管理', 2, '/system/menu', 'system/menu/index', 'system:menu:list', 'tree-table', 3, 1, 1),
(13, '菜单查询', 3, NULL, NULL, 'system:menu:query', NULL, 1, 1, 1),
(13, '菜单新增', 3, NULL, NULL, 'system:menu:add', NULL, 2, 1, 1),
(13, '菜单修改', 3, NULL, NULL, 'system:menu:edit', NULL, 3, 1, 1),
(13, '菜单删除', 3, NULL, NULL, 'system:menu:delete', NULL, 4, 1, 1),
-- 系统工具
(0, '系统工具', 1, '/tool', NULL, NULL, 'tool', 2, 1, 1),
-- 代码生成
(18, '代码生成', 2, '/tool/gen', 'tool/gen/index', 'tool:gen:list', 'code', 1, 1, 1),
(19, '代码生成查询', 3, NULL, NULL, 'tool:gen:list', NULL, 1, 1, 1),
(19, '代码导入', 3, NULL, NULL, 'tool:gen:import', NULL, 2, 1, 1),
(19, '代码生成编辑', 3, NULL, NULL, 'tool:gen:edit', NULL, 3, 1, 1),
(19, '代码生成删除', 3, NULL, NULL, 'tool:gen:delete', NULL, 4, 1, 1),
-- 接口文档 (id=24)
(18, '接口文档', 2, '/tool/api-doc', 'tool/api-doc/index', 'tool:apidoc:view', 'documentation', 2, 1, 1),
-- 字典管理
(1, '字典管理', 2, '/system/dict', 'system/dict/index', 'system:dict:list', 'dict', 4, 1, 1),
(25, '字典查询', 3, NULL, NULL, 'system:dict:query', NULL, 1, 1, 1),
(25, '字典新增', 3, NULL, NULL, 'system:dict:add', NULL, 2, 1, 1),
(25, '字典修改', 3, NULL, NULL, 'system:dict:edit', NULL, 3, 1, 1),
(25, '字典删除', 3, NULL, NULL, 'system:dict:delete', NULL, 4, 1, 1),
-- 操作日志
(1, '操作日志', 2, '/system/log', 'system/log/index', 'system:log:list', 'log', 5, 1, 1),
(30, '日志查询', 3, NULL, NULL, 'system:log:list', NULL, 1, 1, 1),
(30, '日志删除', 3, NULL, NULL, 'system:log:delete', NULL, 2, 1, 1),
-- 在线用户
(1, '在线用户', 2, '/system/online', 'system/online/index', 'system:online:list', 'online', 6, 1, 1),
(33, '在线用户查看', 3, NULL, NULL, 'system:online:list', NULL, 1, 1, 1),
(33, '强制下线', 3, NULL, NULL, 'system:online:forceLogout', NULL, 2, 1, 1),
-- 登录日志
(1, '登录日志', 2, '/system/login-log', 'system/login-log/index', 'system:loginLog:list', 'log', 7, 1, 1),
(36, '登录日志查看', 3, NULL, NULL, 'system:loginLog:list', NULL, 1, 1, 1),
(36, '登录日志删除', 3, NULL, NULL, 'system:loginLog:delete', NULL, 2, 1, 1),
-- 部门管理
(1, '部门管理', 2, '/system/dept', 'system/dept/index', 'system:dept:list', 'peoples', 8, 1, 1),
(39, '部门查询', 3, NULL, NULL, 'system:dept:query', NULL, 1, 1, 1),
(39, '部门新增', 3, NULL, NULL, 'system:dept:add', NULL, 2, 1, 1),
(39, '部门修改', 3, NULL, NULL, 'system:dept:edit', NULL, 3, 1, 1),
(39, '部门删除', 3, NULL, NULL, 'system:dept:delete', NULL, 4, 1, 1),
-- 服务监控
(1, '服务监控', 2, '/system/server', 'system/server/index', 'system:server:list', 'monitor', 9, 1, 1),
(44, '服务监控查看', 3, NULL, NULL, 'system:server:list', NULL, 1, 1, 1),
-- 通知公告
(1, '通知公告', 2, '/system/notice', 'system/notice/index', 'system:notice:list', 'message', 10, 1, 1),
(46, '公告查询', 3, NULL, NULL, 'system:notice:query', NULL, 1, 1, 1),
(46, '公告新增', 3, NULL, NULL, 'system:notice:add', NULL, 2, 1, 1),
(46, '公告修改', 3, NULL, NULL, 'system:notice:edit', NULL, 3, 1, 1),
(46, '公告删除', 3, NULL, NULL, 'system:notice:delete', NULL, 4, 1, 1),
-- 定时任务
(1, '定时任务', 2, '/system/job', 'system/job/index', 'system:job:list', 'tool', 11, 1, 1),
(51, '任务查询', 3, NULL, NULL, 'system:job:query', NULL, 1, 1, 1),
(51, '任务新增', 3, NULL, NULL, 'system:job:add', NULL, 2, 1, 1),
(51, '任务修改', 3, NULL, NULL, 'system:job:edit', NULL, 3, 1, 1),
(51, '任务删除', 3, NULL, NULL, 'system:job:delete', NULL, 4, 1, 1),
-- 岗位管理 (56-60)
(1, '岗位管理', 2, '/system/post', 'system/post/index', 'system:post:list', 'peoples', 13, 1, 1),
(56, '岗位查询', 3, NULL, NULL, 'system:post:query', NULL, 1, 1, 1),
(56, '岗位新增', 3, NULL, NULL, 'system:post:add', NULL, 2, 1, 1),
(56, '岗位修改', 3, NULL, NULL, 'system:post:edit', NULL, 3, 1, 1),
(56, '岗位删除', 3, NULL, NULL, 'system:post:delete', NULL, 4, 1, 1),
-- 参数配置 (61-65)
(1, '参数配置', 2, '/system/config', 'system/config/index', 'system:config:list', 'edit', 14, 1, 1),
(61, '参数查询', 3, NULL, NULL, 'system:config:query', NULL, 1, 1, 1),
(61, '参数新增', 3, NULL, NULL, 'system:config:add', NULL, 2, 1, 1),
(61, '参数修改', 3, NULL, NULL, 'system:config:edit', NULL, 3, 1, 1),
(61, '参数删除', 3, NULL, NULL, 'system:config:delete', NULL, 4, 1, 1),
-- 缓存监控 (66-68)
(1, '缓存监控', 2, '/system/cache', 'system/cache/index', 'system:cache:list', 'redis', 15, 1, 1),
(66, '缓存查看', 3, NULL, NULL, 'system:cache:list', NULL, 1, 1, 1),
(66, '缓存删除', 3, NULL, NULL, 'system:cache:delete', NULL, 2, 1, 1);

-- 初始化用户角色关联 (admin用户 -> 超级管理员角色)
INSERT INTO `sys_user_role` (`user_id`, `role_id`) VALUES (1, 1);

-- 初始化角色菜单关联 (超级管理员拥有所有菜单权限)
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7),
(1, 8), (1, 9), (1, 10), (1, 11), (1, 12),
(1, 13), (1, 14), (1, 15), (1, 16), (1, 17),
(1, 18), (1, 19), (1, 20), (1, 21), (1, 22), (1, 23), (1, 24),
(1, 25), (1, 26), (1, 27), (1, 28), (1, 29),
(1, 30), (1, 31), (1, 32),
(1, 33), (1, 34), (1, 35),
(1, 36), (1, 37), (1, 38),
(1, 39), (1, 40), (1, 41), (1, 42), (1, 43),
(1, 44), (1, 45),
(1, 46), (1, 47), (1, 48), (1, 49), (1, 50),
(1, 51), (1, 52), (1, 53), (1, 54), (1, 55),
(1, 56), (1, 57), (1, 58), (1, 59), (1, 60),
(1, 61), (1, 62), (1, 63), (1, 64), (1, 65),
(1, 66), (1, 67), (1, 68);

-- 初始化字典类型
INSERT INTO `sys_dict_type` (`name`, `type`, `status`) VALUES
('用户性别', 'sys_user_gender', 1),
('状态', 'sys_status', 1),
('菜单类型', 'sys_menu_type', 1),
('通知类型', 'sys_notice_type', 1);

-- 初始化字典数据
INSERT INTO `sys_dict_data` (`dict_type`, `label`, `value`, `sort`, `status`) VALUES
('sys_user_gender', '未知', '0', 1, 1),
('sys_user_gender', '男', '1', 2, 1),
('sys_user_gender', '女', '2', 3, 1),
('sys_status', '禁用', '0', 1, 1),
('sys_status', '正常', '1', 2, 1),
('sys_menu_type', '目录', '1', 1, 1),
('sys_menu_type', '菜单', '2', 2, 1),
('sys_menu_type', '按钮', '3', 3, 1),
('sys_notice_type', '通知', '1', 1, 1),
('sys_notice_type', '公告', '2', 2, 1);

-- 初始化岗位数据
INSERT INTO `sys_post` (`post_code`, `post_name`, `sort`, `status`) VALUES
('ceo', '董事长', 1, 1),
('se', '项目经理', 2, 1),
('hr', '人力资源', 3, 1),
('staff', '普通员工', 4, 1);

-- 初始化参数配置
INSERT INTO `sys_config` (`config_name`, `config_key`, `config_value`, `config_type`, `remark`) VALUES
('是否开启验证码', 'sys.account.captchaEnabled', 'true', 0, '是否开启登录验证码功能（true开启，false关闭）'),
('用户默认密码', 'sys.account.initPassword', '123456', 0, '新增用户时的默认密码'),
('上传文件大小限制(MB)', 'sys.upload.maxSize', '50', 0, '上传文件的大小限制，单位MB');

-- 初始化通知公告
INSERT INTO `sys_notice` (`title`, `type`, `content`, `status`, `create_by`) VALUES
('系统上线通知', 1, '欢迎使用 Demo 后台管理系统，系统已正式上线运行。如有任何问题请联系管理员。', 1, 'admin'),
('关于系统维护的公告', 2, '系统将于每周日凌晨 2:00-4:00 进行例行维护，届时部分功能可能暂时不可用，请提前做好工作安排。', 1, 'admin'),
('新功能更新通知', 1, '本次更新新增了定时任务管理、通知公告、服务监控等模块，提升了系统的运维管理能力。', 1, 'admin');

-- 初始化定时任务
INSERT INTO `sys_job` (`job_name`, `job_group`, `cron_expression`, `bean_name`, `method_name`, `params`, `status`, `remark`) VALUES
('示例任务（无参）', 'DEFAULT', '0 0/30 * * * ?', 'demoTask', 'noParams', NULL, 0, '每30分钟执行一次的示例任务，默认暂停'),
('清理登录日志', 'SYSTEM', '0 0 2 * * ?', 'systemTask', 'cleanLoginLog', NULL, 0, '每天凌晨2点清理30天前的登录日志，按需启用'),
('清理任务日志', 'SYSTEM', '0 0 3 * * ?', 'systemTask', 'cleanJobLog', NULL, 0, '每天凌晨3点清理30天前的任务执行日志，按需启用'),
('清理当天操作日志', 'SYSTEM', '0 0 23 * * ?', 'systemTask', 'cleanTodayOperLog', NULL, 0, '每天23点清理当天的操作日志，按需启用');

-- 初始化部门
INSERT INTO `sys_dept` (`parent_id`, `name`, `sort`, `leader`, `status`) VALUES
(0, 'Demo科技', 1, '管理员', 1),
(1, '技术部', 1, NULL, 1),
(1, '市场部', 2, NULL, 1),
(1, '财务部', 3, NULL, 1);
