-- ============================================
-- 文件管理模块 - 数据库初始化脚本
-- ============================================

-- 1. 创建文件表
CREATE TABLE IF NOT EXISTS `sys_file` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '文件ID',
  `original_name` VARCHAR(255) NOT NULL COMMENT '原始文件名',
  `file_name` VARCHAR(100) NOT NULL COMMENT '存储文件名',
  `file_path` VARCHAR(500) NOT NULL COMMENT '文件存储路径',
  `file_size` BIGINT DEFAULT 0 COMMENT '文件大小(字节)',
  `file_type` VARCHAR(100) COMMENT '文件MIME类型',
  `url` VARCHAR(500) NOT NULL COMMENT '文件访问URL',
  `create_by` VARCHAR(50) COMMENT '上传人',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT DEFAULT 0 COMMENT '删除标志：0-未删除，1-已删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统文件表';

-- 2. 添加文件管理菜单 (parent_id=1 即系统管理目录)
-- 注意: 菜单ID取决于当前数据库自增值，请根据实际情况调整
INSERT INTO `sys_menu` (`parent_id`, `name`, `type`, `path`, `component`, `permission`, `icon`, `sort`, `visible`, `status`) VALUES
(1, '文件管理', 2, '/system/file', 'system/file/index', 'system:file:list', 'file', 12, 1, 1);

-- 获取刚插入的文件管理菜单ID (假设为 @file_menu_id)
SET @file_menu_id = LAST_INSERT_ID();

-- 3. 添加文件管理按钮权限
INSERT INTO `sys_menu` (`parent_id`, `name`, `type`, `path`, `component`, `permission`, `icon`, `sort`, `visible`, `status`) VALUES
(@file_menu_id, '文件列表', 3, NULL, NULL, 'system:file:list', NULL, 1, 1, 1),
(@file_menu_id, '文件上传', 3, NULL, NULL, 'system:file:upload', NULL, 2, 1, 1),
(@file_menu_id, '文件下载', 3, NULL, NULL, 'system:file:download', NULL, 3, 1, 1),
(@file_menu_id, '文件删除', 3, NULL, NULL, 'system:file:delete', NULL, 4, 1, 1);

-- 4. 为超级管理员角色(role_id=1)分配文件管理权限
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES
(1, @file_menu_id),
(1, @file_menu_id + 1),
(1, @file_menu_id + 2),
(1, @file_menu_id + 3),
(1, @file_menu_id + 4);
