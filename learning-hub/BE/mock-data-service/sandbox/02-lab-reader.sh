#!/bin/sh
# Chạy tự động sau 01-init.sql khi container Postgres khởi tạo lần đầu.
# Tạo tài khoản chỉ đọc lab_reader mà Learning Hub dùng để chạy SQL của học viên.
# Mật khẩu lấy từ LAB_READER_PASSWORD (docker-compose.yml), không viết cứng.
set -eu

: "${LAB_READER_PASSWORD:?Thiếu LAB_READER_PASSWORD}"

psql -v ON_ERROR_STOP=1 -v pw="$LAB_READER_PASSWORD" \
  --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
CREATE ROLE lab_reader LOGIN PASSWORD :'pw' NOSUPERUSER NOCREATEDB NOCREATEROLE CONNECTION LIMIT 20;
REVOKE ALL ON DATABASE sales_v1 FROM PUBLIC;
GRANT CONNECT ON DATABASE sales_v1 TO lab_reader;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO lab_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO lab_reader;
ALTER ROLE lab_reader SET default_transaction_read_only = on;
ALTER ROLE lab_reader SET statement_timeout = '5s';

-- Mọi học viên và grader dùng chung lab_reader: chặn xem câu SQL đang chạy của
-- session khác (lộ bài làm và câu tham chiếu khi chấm). Quyền mặc định cấp cho
-- PUBLIC nên phải thu hồi từ PUBLIC; superuser không bị ảnh hưởng.
REVOKE SELECT ON pg_catalog.pg_stat_activity FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION pg_catalog.pg_stat_get_activity(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION pg_catalog.pg_stat_get_backend_activity(integer) FROM PUBLIC;
SQL
