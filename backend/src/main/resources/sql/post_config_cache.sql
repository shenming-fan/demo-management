-- ============================================
-- 增量SQL脚本 (在已有数据库上执行)
-- 包含: 岗位管理 + 参数配置 + 缓存监控 + 日志增强 + 文件表
-- ============================================

-- 1. 创建岗位表
CREATE TABLE IF NOT EXISTS `sys_post` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '岗位ID',
  `post_code` VARCHAR(64) NOT NULL COMMENT '岗位编码',
  `post_name` VARCHAR(50) NOT NULL COMMENT '岗位名称',
  `sort` INT DEFAULT 0 COMMENT '排序',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT DEFAULT 0 COMMENT '删除标志：0-未删除，1-已删除',
  UNIQUE KEY `uk_post_code` (`post_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='岗位表';

-- 2. 创建用户岗位关联表
CREATE TABLE IF NOT EXISTS `sys_user_post` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `post_id` BIGINT NOT NULL COMMENT '岗位ID',
  KEY `idx_user_id` (`user_id`),
  KEY `idx_post_id` (`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户岗位关联表';

-- 3. 创建参数配置表
CREATE TABLE IF NOT EXISTS `sys_config` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '参数ID',
  `config_name` VARCHAR(100) NOT NULL COMMENT '参数名称',
  `config_key` VARCHAR(100) NOT NULL COMMENT '参数键名',
  `config_value` VARCHAR(500) DEFAULT '' COMMENT '参数键值',
  `config_type` TINYINT DEFAULT 1 COMMENT '类型：0-系统内置，1-自定义',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT DEFAULT 0 COMMENT '删除标志：0-未删除，1-已删除',
  UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='参数配置表';

-- 4. 创建文件表（如果不存在）
CREATE TABLE IF NOT EXISTS `sys_file` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '文件ID',
  `original_name` VARCHAR(255) NOT NULL COMMENT '原始文件名',
  `file_name` VARCHAR(255) NOT NULL COMMENT '存储文件名',
  `file_path` VARCHAR(500) NOT NULL COMMENT '文件存储路径',
  `file_size` BIGINT DEFAULT 0 COMMENT '文件大小(字节)',
  `file_type` VARCHAR(100) DEFAULT NULL COMMENT '文件MIME类型',
  `url` VARCHAR(500) DEFAULT NULL COMMENT '文件访问URL',
  `create_by` VARCHAR(64) DEFAULT NULL COMMENT '上传人',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT DEFAULT 0 COMMENT '删除标志：0-未删除，1-已删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统文件表';

-- 5. sys_log 表新增 status 和 error_msg 字段（如果不存在）
-- 注意：如果字段已存在会报错，可忽略或先用下面的判断方式
ALTER TABLE `sys_log` ADD COLUMN `status` TINYINT DEFAULT 1 COMMENT '操作状态：0-失败，1-成功';
ALTER TABLE `sys_log` ADD COLUMN `error_msg` VARCHAR(2000) DEFAULT NULL COMMENT '错误信息';
ALTER TABLE `sys_log` ADD COLUMN `response_body` VARCHAR(2000) DEFAULT NULL COMMENT '响应结果';
-- 如果上面两句报 "Duplicate column" 错误，说明字段已存在，忽略即可

-- 6. 初始化岗位数据
INSERT INTO `sys_post` (`post_code`, `post_name`, `sort`, `status`) VALUES
('ceo', '董事长', 1, 1),
('se', '项目经理', 2, 1),
('hr', '人力资源', 3, 1),
('staff', '普通员工', 4, 1);

-- 7. 初始化参数配置数据
INSERT INTO `sys_config` (`config_name`, `config_key`, `config_value`, `config_type`, `remark`) VALUES
('是否开启验证码', 'sys.account.captchaEnabled', 'true', 0, '是否开启登录验证码功能（true开启，false关闭）'),
('用户默认密码', 'sys.account.initPassword', '123456', 0, '新增用户时的默认密码'),
('上传文件大小限制(MB)', 'sys.upload.maxSize', '50', 0, '上传文件的大小限制，单位MB');

-- 8. 添加岗位管理菜单
INSERT INTO `sys_menu` (`parent_id`, `name`, `type`, `path`, `component`, `permission`, `icon`, `sort`, `visible`, `status`) VALUES
(1, '岗位管理', 2, '/system/post', 'system/post/index', 'system:post:list', 'peoples', 13, 1, 1);

SET @post_menu_id = LAST_INSERT_ID();

INSERT INTO `sys_menu` (`parent_id`, `name`, `type`, `path`, `component`, `permission`, `icon`, `sort`, `visible`, `status`) VALUES
(@post_menu_id, '岗位查询', 3, NULL, NULL, 'system:post:query', NULL, 1, 1, 1),
(@post_menu_id, '岗位新增', 3, NULL, NULL, 'system:post:add', NULL, 2, 1, 1),
(@post_menu_id, '岗位修改', 3, NULL, NULL, 'system:post:edit', NULL, 3, 1, 1),
(@post_menu_id, '岗位删除', 3, NULL, NULL, 'system:post:delete', NULL, 4, 1, 1);

-- 9. 添加参数配置菜单
INSERT INTO `sys_menu` (`parent_id`, `name`, `type`, `path`, `component`, `permission`, `icon`, `sort`, `visible`, `status`) VALUES
(1, '参数配置', 2, '/system/config', 'system/config/index', 'system:config:list', 'edit', 14, 1, 1);

SET @config_menu_id = LAST_INSERT_ID();

INSERT INTO `sys_menu` (`parent_id`, `name`, `type`, `path`, `component`, `permission`, `icon`, `sort`, `visible`, `status`) VALUES
(@config_menu_id, '参数查询', 3, NULL, NULL, 'system:config:query', NULL, 1, 1, 1),
(@config_menu_id, '参数新增', 3, NULL, NULL, 'system:config:add', NULL, 2, 1, 1),
(@config_menu_id, '参数修改', 3, NULL, NULL, 'system:config:edit', NULL, 3, 1, 1),
(@config_menu_id, '参数删除', 3, NULL, NULL, 'system:config:delete', NULL, 4, 1, 1);

-- 10. 添加缓存监控菜单
INSERT INTO `sys_menu` (`parent_id`, `name`, `type`, `path`, `component`, `permission`, `icon`, `sort`, `visible`, `status`) VALUES
(1, '缓存监控', 2, '/system/cache', 'system/cache/index', 'system:cache:list', 'redis', 15, 1, 1);

SET @cache_menu_id = LAST_INSERT_ID();

INSERT INTO `sys_menu` (`parent_id`, `name`, `type`, `path`, `component`, `permission`, `icon`, `sort`, `visible`, `status`) VALUES
(@cache_menu_id, '缓存查看', 3, NULL, NULL, 'system:cache:list', NULL, 1, 1, 1),
(@cache_menu_id, '缓存删除', 3, NULL, NULL, 'system:cache:delete', NULL, 2, 1, 1);

-- 11. 为超级管理员角色(role_id=1)分配新菜单权限
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES
(1, @post_menu_id),
(1, @post_menu_id + 1),
(1, @post_menu_id + 2),
(1, @post_menu_id + 3),
(1, @post_menu_id + 4),
(1, @config_menu_id),
(1, @config_menu_id + 1),
(1, @config_menu_id + 2),
(1, @config_menu_id + 3),
(1, @config_menu_id + 4),
(1, @cache_menu_id),
(1, @cache_menu_id + 1),
(1, @cache_menu_id + 2);

-- 12. sys_log 表新增变更对比字段
ALTER TABLE `sys_log` ADD COLUMN `old_value` TEXT DEFAULT NULL COMMENT '变更前数据';
ALTER TABLE `sys_log` ADD COLUMN `new_value` TEXT DEFAULT NULL COMMENT '变更后数据';

-- 13. 添加接口文档菜单 (系统工具下)
SET @tool_parent_id = (SELECT id FROM sys_menu WHERE path = '/tool' LIMIT 1);

INSERT INTO `sys_menu` (`parent_id`, `name`, `type`, `path`, `component`, `permission`, `icon`, `sort`, `visible`, `status`) VALUES
(@tool_parent_id, '接口文档', 2, '/tool/api-doc', 'tool/api-doc/index', 'tool:apidoc:view', 'documentation', 2, 1, 1);

SET @apidoc_menu_id = LAST_INSERT_ID();

INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, @apidoc_menu_id);
