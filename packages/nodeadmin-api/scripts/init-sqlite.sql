-- ============================================================
-- NodeAdmin SQLite 初始化脚本
-- 适用数据库：SQLite（sqljs 驱动）
-- 用途：生产环境手动建表（不依赖 TypeORM synchronize）
-- 注意：TypeORM synchronize=true 时可自动建表，此脚本作为备用
-- ============================================================

-- 用户表
CREATE TABLE IF NOT EXISTS "users" (
  "id"            INTEGER       PRIMARY KEY AUTOINCREMENT,
  "username"      VARCHAR(64)   NOT NULL UNIQUE,
  "password"      VARCHAR(128)  NOT NULL,
  "nickname"      VARCHAR(64)   NOT NULL DEFAULT '',
  "email"         VARCHAR(128)  NOT NULL DEFAULT '',
  "phone"         VARCHAR(32)   NOT NULL DEFAULT '',
  "avatar"        TEXT          NOT NULL,
  "status"        INTEGER       NOT NULL DEFAULT 1,
  "remark"        VARCHAR(255)  NOT NULL DEFAULT '',
  "created_at"    DATETIME      NOT NULL DEFAULT (datetime('now')),
  "updated_at"    DATETIME      NOT NULL DEFAULT (datetime('now'))
);

-- 角色表
CREATE TABLE IF NOT EXISTS "roles" (
  "id"            INTEGER       PRIMARY KEY AUTOINCREMENT,
  "code"          VARCHAR(64)   NOT NULL UNIQUE,
  "name"          VARCHAR(64)   NOT NULL,
  "status"        INTEGER       NOT NULL DEFAULT 1,
  "sort"          INTEGER       NOT NULL DEFAULT 0,
  "remark"        VARCHAR(255)  NOT NULL DEFAULT '',
  "created_at"    DATETIME      NOT NULL DEFAULT (datetime('now')),
  "updated_at"    DATETIME      NOT NULL DEFAULT (datetime('now'))
);

-- 菜单/按钮权限表
CREATE TABLE IF NOT EXISTS "menus" (
  "id"            INTEGER       PRIMARY KEY AUTOINCREMENT,
  "parent_id"     INTEGER       NOT NULL DEFAULT 0,
  "name"          VARCHAR(64)   NOT NULL,
  "path"          VARCHAR(128)  NOT NULL DEFAULT '',
  "component"     VARCHAR(128)  NOT NULL DEFAULT '',
  "icon"          VARCHAR(64)   NOT NULL DEFAULT '',
  "type"          VARCHAR(2)    NOT NULL DEFAULT 'M',
  "perm"          VARCHAR(128)  NOT NULL DEFAULT '',
  "sort"          INTEGER       NOT NULL DEFAULT 0,
  "hidden"        INTEGER       NOT NULL DEFAULT 0,
  "status"        INTEGER       NOT NULL DEFAULT 1,
  "created_at"    DATETIME      NOT NULL DEFAULT (datetime('now')),
  "updated_at"    DATETIME      NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS "idx_parent_id" ON "menus" ("parent_id");

-- 字典表
CREATE TABLE IF NOT EXISTS "dicts" (
  "id"            INTEGER       PRIMARY KEY AUTOINCREMENT,
  "type"          VARCHAR(64)   NOT NULL,
  "label"         VARCHAR(128)  NOT NULL,
  "value"         VARCHAR(128)  NOT NULL,
  "sort"          INTEGER       NOT NULL DEFAULT 0,
  "status"        INTEGER       NOT NULL DEFAULT 1,
  "remark"        VARCHAR(255)  NOT NULL DEFAULT '',
  "created_at"    DATETIME      NOT NULL DEFAULT (datetime('now')),
  "updated_at"    DATETIME      NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS "idx_type" ON "dicts" ("type");

-- 站点配置表（key-value）
CREATE TABLE IF NOT EXISTS "options" (
  "id"            INTEGER       PRIMARY KEY AUTOINCREMENT,
  "key"           VARCHAR(64)   NOT NULL UNIQUE,
  "value"         TEXT          NOT NULL,
  "extend"        VARCHAR(4096) NOT NULL DEFAULT ''
);

-- 用户-角色关联表（联合主键）
CREATE TABLE IF NOT EXISTS "user_roles" (
  "user_id"       INTEGER       NOT NULL,
  "role_id"       INTEGER       NOT NULL,
  PRIMARY KEY ("user_id", "role_id")
);

-- 角色-菜单关联表（联合主键）
CREATE TABLE IF NOT EXISTS "role_menus" (
  "role_id"       INTEGER       NOT NULL,
  "menu_id"       INTEGER       NOT NULL,
  PRIMARY KEY ("role_id", "menu_id")
);

-- 定时任务表
CREATE TABLE IF NOT EXISTS "cron_jobs" (
  "id"                INTEGER       PRIMARY KEY AUTOINCREMENT,
  "name"              VARCHAR(100)  NOT NULL,
  "group"             VARCHAR(50)   NOT NULL DEFAULT 'default',
  "cron_expression"   VARCHAR(50)   NOT NULL,
  "handler"           VARCHAR(100)  NOT NULL,
  "params"            TEXT,
  "description"       VARCHAR(255)  NOT NULL DEFAULT '',
  "status"            INTEGER       NOT NULL DEFAULT 1,
  "concurrent"        INTEGER       NOT NULL DEFAULT 0,
  "misfire_policy"    INTEGER       NOT NULL DEFAULT 1,
  "last_execute_time" DATETIME,
  "next_execute_time" DATETIME,
  "created_at"        DATETIME      NOT NULL DEFAULT (datetime('now')),
  "updated_at"        DATETIME      NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS "idx_cron_job_status" ON "cron_jobs" ("status");
CREATE INDEX IF NOT EXISTS "idx_cron_job_handler" ON "cron_jobs" ("handler");

-- 定时任务执行日志表
CREATE TABLE IF NOT EXISTS "cron_logs" (
  "id"             INTEGER       PRIMARY KEY AUTOINCREMENT,
  "job_id"         INTEGER       NOT NULL,
  "status"         INTEGER       NOT NULL DEFAULT 2,
  "start_time"     DATETIME      NOT NULL,
  "end_time"       DATETIME,
  "duration"       INTEGER,
  "result"         TEXT,
  "error_message"  TEXT,
  "created_at"     DATETIME      NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY ("job_id") REFERENCES "cron_jobs" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_cron_log_job_id" ON "cron_logs" ("job_id");
CREATE INDEX IF NOT EXISTS "idx_cron_log_status" ON "cron_logs" ("status");
CREATE INDEX IF NOT EXISTS "idx_cron_log_created" ON "cron_logs" ("created_at");

-- ============================================================
-- 默认数据（Seed）
-- 超管账号：admin / admin123
-- ============================================================

-- 1. 角色
INSERT INTO "roles" ("id", "code", "name", "status", "sort", "remark") VALUES
  (1, 'super_admin', '超级管理员', 1, 100, '系统超级管理员，拥有所有权限'),
  (2, 'admin',       '管理员',     1, 50,  '业务管理员'),
  (3, 'user',        '普通用户',   1, 10,  '普通用户，仅可访问仪表盘和个人中心');

-- 2. 菜单（id 顺序对应 seed.service.ts 中的 key）
INSERT INTO "menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "perm", "sort", "hidden", "status") VALUES
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
INSERT INTO "role_menus" ("role_id", "menu_id") VALUES
  (1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),(1,10),
  (1,11),(1,12),(1,13),(1,14),(1,15),(1,16),(1,17),(1,18),(1,19),(1,20),
  (1,21),(1,22),(1,23),(1,24),(1,25),(1,26),(1,27),(1,28),(1,29);

-- admin（角色ID=2）：仪表盘 + 用户/角色/字典/站点/定时任务（不含菜单管理）+ 个人中心 + 修改密码
INSERT INTO "role_menus" ("role_id", "menu_id") VALUES
  (2,1),(2,2),(2,3),(2,4),(2,5),(2,6),(2,7),(2,8),(2,9),(2,10),
  (2,11),(2,12),(2,17),(2,18),(2,19),(2,20),(2,21),(2,22),
  (2,23),(2,24),(2,25),(2,26),(2,27),(2,28),(2,29);

-- user（角色ID=3）：仅仪表盘 + 个人中心 + 修改密码
INSERT INTO "role_menus" ("role_id", "menu_id") VALUES
  (3,1),(3,28),(3,29);

-- 4. 超管账号 admin / admin123（bcrypt 哈希）
INSERT INTO "users" ("id", "username", "password", "nickname", "status", "remark") VALUES
  (1, 'admin', '$2b$10$iCEJx99hzdCegzS0.usut.s1SYR3I82cJXo0LhO/1JNK/QG/srklW', '超级管理员', 1, '系统内置超级管理员账号');

-- 5. 用户-角色关联：admin → super_admin
INSERT INTO "user_roles" ("user_id", "role_id") VALUES (1, 1);
