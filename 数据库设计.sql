-- 互联网支教教学反思墙系统
-- 数据库初稿（MySQL 8.0）

CREATE DATABASE IF NOT EXISTS fansq
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE fansq;

CREATE TABLE IF NOT EXISTS admin_user (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  username VARCHAR(100) NOT NULL COMMENT '登录名',
  password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
  role VARCHAR(50) NOT NULL DEFAULT 'admin' COMMENT '角色',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_admin_user_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

CREATE TABLE IF NOT EXISTS reflection (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  student_name VARCHAR(100) NOT NULL COMMENT 'QQ群昵称',
  submit_content TEXT NOT NULL COMMENT '反思正文',
  submit_time DATETIME NOT NULL COMMENT '提交时间',
  submit_channel VARCHAR(50) NOT NULL DEFAULT 'qq_group_bot' COMMENT '提交渠道',
  source_group_id VARCHAR(100) DEFAULT NULL COMMENT 'QQ群唯一标识',
  source_group_name VARCHAR(200) DEFAULT NULL COMMENT 'QQ群名称',
  raw_message_id VARCHAR(100) DEFAULT NULL COMMENT '原始消息ID',
  audit_status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '审核状态: pending/approved/rejected',
  display_status VARCHAR(20) NOT NULL DEFAULT 'hidden' COMMENT '展示状态: hidden/visible',
  is_featured TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否精选',
  is_top TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否置顶',
  is_anonymous TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否匿名展示',
  display_name VARCHAR(100) DEFAULT NULL COMMENT '前台显示名',
  like_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '点赞数',
  remarks TEXT DEFAULT NULL COMMENT '管理员备注',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_reflection_submit_time (submit_time),
  KEY idx_reflection_audit_status (audit_status),
  KEY idx_reflection_display_status (display_status),
  KEY idx_reflection_group_id (source_group_id),
  KEY idx_reflection_created_at (created_at),
  KEY idx_reflection_public_sort (is_top, submit_time),
  KEY idx_reflection_public_filter (audit_status, display_status, is_featured),
  KEY idx_reflection_like_count (like_count),
  KEY idx_reflection_raw_message_id (raw_message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教学反思表';

CREATE TABLE IF NOT EXISTS reflection_like (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  reflection_id BIGINT UNSIGNED NOT NULL COMMENT '反思ID',
  visitor_id VARCHAR(100) NOT NULL COMMENT '前台访问者唯一标识',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_reflection_like_unique (reflection_id, visitor_id),
  KEY idx_reflection_like_visitor_id (visitor_id),
  KEY idx_reflection_like_created_at (created_at),
  CONSTRAINT fk_reflection_like_reflection
    FOREIGN KEY (reflection_id) REFERENCES reflection(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='反思点赞记录表';

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  reflection_id BIGINT UNSIGNED NOT NULL COMMENT '反思ID',
  admin_user_id BIGINT UNSIGNED NOT NULL COMMENT '管理员ID',
  action VARCHAR(50) NOT NULL COMMENT '操作类型',
  action_detail TEXT DEFAULT NULL COMMENT '操作详情',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (id),
  KEY idx_audit_log_reflection_id (reflection_id),
  KEY idx_audit_log_admin_user_id (admin_user_id),
  KEY idx_audit_log_created_at (created_at),
  CONSTRAINT fk_audit_log_reflection
    FOREIGN KEY (reflection_id) REFERENCES reflection(id),
  CONSTRAINT fk_audit_log_admin_user
    FOREIGN KEY (admin_user_id) REFERENCES admin_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审核日志表';

-- 初始化管理员账号时，只插入哈希后的密码，不要存明文。
-- 示例：
-- INSERT INTO admin_user (username, password_hash, role)
-- VALUES ('admin', '$2b$12$replace_with_real_bcrypt_hash', 'admin');
