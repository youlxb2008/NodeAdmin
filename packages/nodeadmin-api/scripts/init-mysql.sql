-- ============================================================
-- NodeAdmin MySQL 初始化脚本
-- 适用数据库：MySQL 5.7+ / 8.0+
-- 字符集：utf8mb4（支持 emoji 和完整 Unicode）
-- 用途：生产环境手动建表（不依赖 TypeORM synchronize）
-- 注意：TypeORM synchronize=true 时可自动建表，此脚本作为备用
-- ============================================================

-- 创建数据库（按需修改名称）
-- CREATE DATABASE IF NOT EXISTS `nodeadmin` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
-- USE `nodeadmin`;

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(64)     NOT NULL COMMENT '登录账号，全局唯一',
  `password`      VARCHAR(128)    NOT NULL COMMENT '密码 bcrypt 哈希',
  `nickname`      VARCHAR(64)     NOT NULL DEFAULT '' COMMENT '昵称',
  `email`         VARCHAR(128)    NOT NULL DEFAULT '' COMMENT '邮箱',
  `phone`         VARCHAR(32)     NOT NULL DEFAULT '' COMMENT '手机号',
  `avatar`        TEXT            NOT NULL COMMENT '头像 URL',
  `status`        TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态：1=启用 0=禁用',
  `remark`        VARCHAR(255)    NOT NULL DEFAULT '' COMMENT '备注',
  `created_at`    DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at`    DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户表';

-- 角色表
CREATE TABLE IF NOT EXISTS `roles` (
  `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `code`          VARCHAR(64)     NOT NULL COMMENT '角色编码，全局唯一',
  `name`          VARCHAR(64)     NOT NULL COMMENT '角色名称',
  `status`        TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态：1=启用 0=禁用',
  `sort`          INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '排序权重',
  `remark`        VARCHAR(255)    NOT NULL DEFAULT '' COMMENT '备注',
  `created_at`    DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at`    DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_roles_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='角色表';

-- 菜单/按钮权限表
CREATE TABLE IF NOT EXISTS `menus` (
  `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `parent_id`     INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '父菜单 ID，0=根节点',
  `name`          VARCHAR(64)     NOT NULL COMMENT '菜单/按钮名称',
  `path`          VARCHAR(128)    NOT NULL DEFAULT '' COMMENT '前端路由路径',
  `component`     VARCHAR(128)    NOT NULL DEFAULT '' COMMENT '前端组件路径',
  `icon`          VARCHAR(64)     NOT NULL DEFAULT '' COMMENT '图标标识',
  `type`          VARCHAR(2)      NOT NULL DEFAULT 'M' COMMENT '类型：M=菜单 B=按钮',
  `perm`          VARCHAR(128)    NOT NULL DEFAULT '' COMMENT '权限码',
  `sort`          INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '排序权重',
  `hidden`        TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否隐藏：1=隐藏 0=显示',
  `status`        TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态：1=启用 0=禁用',
  `created_at`    DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at`    DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='菜单/按钮权限表';

-- 字典表
CREATE TABLE IF NOT EXISTS `dicts` (
  `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `type`          VARCHAR(64)     NOT NULL COMMENT '字典类型编码',
  `label`         VARCHAR(128)    NOT NULL COMMENT '显示文本',
  `value`         VARCHAR(128)    NOT NULL COMMENT '实际取值',
  `sort`          INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '排序权重',
  `status`        TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态：1=启用 0=禁用',
  `remark`        VARCHAR(255)    NOT NULL DEFAULT '' COMMENT '备注',
  `created_at`    DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at`    DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='字典表';

-- 站点配置表（key-value）
CREATE TABLE IF NOT EXISTS `options` (
  `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `key`           VARCHAR(64)     NOT NULL COMMENT '配置键，全局唯一',
  `value`         TEXT            NOT NULL COMMENT '配置值，JSON 字符串',
  `extend`        VARCHAR(4096)   NOT NULL DEFAULT '' COMMENT '扩展字段（预留）',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_options_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='站点配置表';

-- 用户-角色关联表
CREATE TABLE IF NOT EXISTS `user_roles` (
  `user_id`       INT UNSIGNED    NOT NULL COMMENT '用户 ID',
  `role_id`       INT UNSIGNED    NOT NULL COMMENT '角色 ID',
  PRIMARY KEY (`user_id`, `role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户-角色关联表';

-- 角色-菜单关联表
CREATE TABLE IF NOT EXISTS `role_menus` (
  `role_id`       INT UNSIGNED    NOT NULL COMMENT '角色 ID',
  `menu_id`       INT UNSIGNED    NOT NULL COMMENT '菜单 ID',
  PRIMARY KEY (`role_id`, `menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='角色-菜单关联表';

-- 定时任务表
CREATE TABLE IF NOT EXISTS `cron_jobs` (
  `id`                INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `name`              VARCHAR(100)    NOT NULL COMMENT '任务名称',
  `group`             VARCHAR(50)     NOT NULL DEFAULT 'default' COMMENT '任务分组',
  `cron_expression`   VARCHAR(50)     NOT NULL COMMENT 'Cron 表达式（6 位秒级）',
  `handler`           VARCHAR(100)    NOT NULL COMMENT '处理器名称',
  `params`            TEXT            NULL COMMENT '任务参数（JSON）',
  `description`       VARCHAR(255)    NOT NULL DEFAULT '' COMMENT '任务描述',
  `status`            TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态：0=暂停 1=启用',
  `concurrent`        TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否允许并发：0=不允许 1=允许',
  `misfire_policy`    TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '过期策略：1=立即执行 2=放弃 3=仅执行一次',
  `last_execute_time` DATETIME(6)     NULL COMMENT '最后执行时间',
  `next_execute_time` DATETIME(6)     NULL COMMENT '下次执行时间',
  `created_at`        DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at`        DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_cron_job_status` (`status`),
  KEY `idx_cron_job_handler` (`handler`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='定时任务表';

-- 定时任务执行日志表
CREATE TABLE IF NOT EXISTS `cron_logs` (
  `id`             INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `job_id`         INT UNSIGNED    NOT NULL COMMENT '关联任务 ID',
  `status`         TINYINT UNSIGNED NOT NULL DEFAULT 2 COMMENT '状态：0=失败 1=成功 2=执行中',
  `start_time`     DATETIME(6)     NOT NULL COMMENT '开始时间',
  `end_time`       DATETIME(6)     NULL COMMENT '结束时间',
  `duration`       INT UNSIGNED    NULL COMMENT '耗时（毫秒）',
  `result`         TEXT            NULL COMMENT '执行结果',
  `error_message`  TEXT            NULL COMMENT '错误信息',
  `created_at`     DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_cron_log_job_id` (`job_id`),
  KEY `idx_cron_log_status` (`status`),
  KEY `idx_cron_log_created` (`created_at`),
  CONSTRAINT `fk_cron_logs_job_id` FOREIGN KEY (`job_id`) REFERENCES `cron_jobs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='定时任务执行日志表';

-- ============================================================
-- 默认数据（Seed）
-- 超管账号：admin / admin123
-- ============================================================

-- 1. 角色
INSERT INTO `roles` (`id`, `code`, `name`, `status`, `sort`, `remark`) VALUES
  (1, 'super_admin', '超级管理员', 1, 100, '系统超级管理员，拥有所有权限'),
  (2, 'admin',       '管理员',     1, 50,  '业务管理员'),
  (3, 'user',        '普通用户',   1, 10,  '普通用户，仅可访问仪表盘和个人中心');

-- 2. 菜单（id 顺序对应 seed.service.ts 中的 key）
INSERT INTO `menus` (`id`, `parent_id`, `name`, `path`, `component`, `icon`, `type`, `perm`, `sort`, `hidden`, `status`) VALUES
  -- 仪表盘
  (1,  0, '仪表盘',   '/dashboard',       'dashboard/index',       'ph:gauge',               'M', 'dashboard:view',      100, 0, 1),
  -- 系统管理（父节点）
  (2,  0, '系统管理', '/system',           '',                       'ph:gear',                'M', '',                      20, 0, 1),
  -- 用户管理
  (3,  2, '用户管理', '/system/user',      'system/user/index',     'ph:user',                'M', 'system:user:list',      4, 0, 1),
  (4,  3, '新增用户', '',                   '',                       '',                       'B', 'system:user:create',    0, 0, 1),
  (5,  3, '编辑用户', '',                   '',                       '',                       'B', 'system:user:update',    0, 0, 1),
  (6,  3, '删除用户', '',                   '',                       '',                       'B', 'system:user:delete',    0, 0, 1),
  (7,  3, '分配角色', '',                   '',                       '',                       'B', 'system:user:assignRoles', 0, 0, 1),
  -- 角色管理
  (8,  2, '角色管理', '/system/role',      'system/role/index',     'ph:users-three',         'M', 'system:role:list',      3, 0, 1),
  (9,  8, '新增角色', '',                   '',                       '',                       'B', 'system:role:create',    0, 0, 1),
  (10, 8, '编辑角色', '',                   '',                       '',                       'B', 'system:role:update',    0, 0, 1),
  (11, 8, '删除角色', '',                   '',                       '',                       'B', 'system:role:delete',    0, 0, 1),
  (12, 8, '分配菜单', '',                   '',                       '',                       'B', 'system:role:assignMenus', 0, 0, 1),
  -- 菜单管理
  (13, 2, '菜单管理', '/system/menu',      'system/menu/index',     'ph:tree-structure',      'M', 'system:menu:list',      2, 0, 1),
  (14, 13, '新增菜单', '',                  '',                       '',                       'B', 'system:menu:create',    0, 0, 1),
  (15, 13, '编辑菜单', '',                  '',                       '',                       'B', 'system:menu:update',    0, 0, 1),
  (16, 13, '删除菜单', '',                  '',                       '',                       'B', 'system:menu:delete',    0, 0, 1),
  -- 字典管理
  (17, 2, '字典管理', '/system/dict',      'system/dict/index',     'ph:book-open',           'M', 'system:dict:list',      1, 0, 1),
  (18, 17, '新增字典', '',                  '',                       '',                       'B', 'system:dict:create',    0, 0, 1),
  (19, 17, '编辑字典', '',                  '',                       '',                       'B', 'system:dict:update',    0, 0, 1),
  (20, 17, '删除字典', '',                  '',                       '',                       'B', 'system:dict:delete',    0, 0, 1),
  -- 站点设置
  (21, 2, '站点设置', '/system/site',      'system/site/index',     'ph:sliders-horizontal',  'M', 'system:site:list',      0, 0, 1),
  (22, 21, '更新设置', '',                  '',                       '',                       'B', 'system:site:update',    0, 0, 1),
  -- 定时任务
  (23, 2, '定时任务', '/system/cron',      'system/cron/index',     'ph:clock-countdown',     'M', 'system:cron:list',     -1, 0, 1),
  (24, 23, '新增任务', '',                  '',                       '',                       'B', 'system:cron:create',    0, 0, 1),
  (25, 23, '编辑任务', '',                  '',                       '',                       'B', 'system:cron:update',    0, 0, 1),
  (26, 23, '删除任务', '',                  '',                       '',                       'B', 'system:cron:delete',    0, 0, 1),
  (27, 23, '手动执行', '',                  '',                       '',                       'B', 'system:cron:trigger',   0, 0, 1),
  -- 个人中心（hidden=1，通过 header 入口跳转）
  (28, 0, '个人中心', '/profile/index',    'profile/index',         'ph:identification-card', 'M', 'profile:view',          5, 1, 1),
  -- 修改密码（hidden=1）
  (29, 0, '修改密码', '/profile/password', 'profile/password',      'ph:lock-key',            'M', 'profile:password',      4, 1, 1);

-- 3. 角色-菜单关联
-- super_admin（角色ID=1）：所有菜单
INSERT INTO `role_menus` (`role_id`, `menu_id`) VALUES
  (1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),(1,10),
  (1,11),(1,12),(1,13),(1,14),(1,15),(1,16),(1,17),(1,18),(1,19),(1,20),
  (1,21),(1,22),(1,23),(1,24),(1,25),(1,26),(1,27),(1,28),(1,29);

-- admin（角色ID=2）：仪表盘 + 用户/角色/字典/站点/定时任务（不含菜单管理）+ 个人中心 + 修改密码
INSERT INTO `role_menus` (`role_id`, `menu_id`) VALUES
  (2,1),(2,2),(2,3),(2,4),(2,5),(2,6),(2,7),(2,8),(2,9),(2,10),
  (2,11),(2,12),(2,17),(2,18),(2,19),(2,20),(2,21),(2,22),
  (2,23),(2,24),(2,25),(2,26),(2,27),(2,28),(2,29);

-- user（角色ID=3）：仅仪表盘 + 个人中心 + 修改密码
INSERT INTO `role_menus` (`role_id`, `menu_id`) VALUES
  (3,1),(3,28),(3,29);

-- 4. 超管账号 admin / admin123（bcrypt 哈希）
INSERT INTO `users` (`id`, `username`, `password`, `nickname`, `status`, `remark`) VALUES
  (1, 'admin', '$2b$10$iCEJx99hzdCegzS0.usut.s1SYR3I82cJXo0LhO/1JNK/QG/srklW', '超级管理员', 1, '系统内置超级管理员账号');

-- 5. 用户-角色关联：admin → super_admin
INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES (1, 1);
