#!/bin/bash
# ============================================================
# Julie Cosmetics — Database Restore Script
# Phục hồi CSDL MySQL từ file backup
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Nạp cấu hình env nếu có để script chạy đồng nhất với local/docker flow
if [ -f "${PROJECT_ROOT}/server/.env" ]; then
  set -a
  . "${PROJECT_ROOT}/server/.env"
  set +a
fi

if [ -f "${PROJECT_ROOT}/.env" ]; then
  set -a
  . "${PROJECT_ROOT}/.env"
  set +a
fi

DB_NAME="${DB_NAME:-julie_cosmetics}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3307}"
DB_USER="${DB_USER:-julie_app}"
DB_PASS="${DB_PASSWORD:-${DB_PASS:-}}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-root}"
MYSQL_CONTAINER="${MYSQL_CONTAINER:-julie_mysql}"
BACKUP_DIR="${SCRIPT_DIR}/backups"
FORCE_RESTORE="${FORCE:-0}"

print_usage() {
  local script_name
  script_name="$(basename "$0")"
  echo "📋 Danh sách backup hiện có:"
  ls -lt "$BACKUP_DIR"/backup_*.sql.gz "$BACKUP_DIR"/backup_*.sql 2>/dev/null || echo "  (Chưa có bản backup nào)"
  echo ""
  echo "Cách dùng:"
  echo "  ./$script_name <ten_file_backup>"
  echo "  FORCE=1 ./$script_name <ten_file_backup>   # bỏ qua bước hỏi lại"
  echo ""
  echo "Ví dụ:"
  echo "  ./$script_name backup_20260417_093000.sql.gz"
}

run_mysql_command() {
  local command="$1"

  if command -v mysql >/dev/null 2>&1; then
    if [ -z "$DB_PASS" ]; then
      mysql --default-character-set=utf8mb4 -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -e "$command"
    else
      mysql --default-character-set=utf8mb4 -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "$command"
    fi
  elif command -v docker >/dev/null 2>&1 && docker ps -a --format '{{.Names}}' | grep -qx "$MYSQL_CONTAINER"; then
    docker exec "$MYSQL_CONTAINER" mysql --default-character-set=utf8mb4 -uroot -p"$MYSQL_ROOT_PASSWORD" -e "$command"
  else
    echo "❌ Không tìm thấy mysql client local hoặc container ${MYSQL_CONTAINER} để thực hiện restore!"
    exit 1
  fi
}

restore_from_file() {
  local sql_file="$1"

  if command -v mysql >/dev/null 2>&1; then
    if [ -z "$DB_PASS" ]; then
      mysql --default-character-set=utf8mb4 -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" < "$sql_file"
    else
      mysql --default-character-set=utf8mb4 -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$sql_file"
    fi
  elif command -v docker >/dev/null 2>&1 && docker ps -a --format '{{.Names}}' | grep -qx "$MYSQL_CONTAINER"; then
    docker exec -i "$MYSQL_CONTAINER" mysql --default-character-set=utf8mb4 -uroot -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME" < "$sql_file"
  else
    echo "❌ Không tìm thấy mysql client local hoặc container ${MYSQL_CONTAINER} để thực hiện restore!"
    exit 1
  fi
}

if [ $# -eq 0 ]; then
  print_usage
  exit 0
fi

BACKUP_FILE="${BACKUP_DIR}/$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Không tìm thấy file backup: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  Sắp phục hồi database ${DB_NAME}"
echo "   Host: ${DB_HOST}:${DB_PORT}"
echo "   User: ${DB_USER}"
echo "   File: $1"
echo "   Toàn bộ dữ liệu hiện tại của ${DB_NAME} sẽ bị thay thế."

if [ "$FORCE_RESTORE" != "1" ]; then
  read -r -p "Bạn có chắc chắn? (y/N): " confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "❌ Đã hủy phục hồi"
    exit 0
  fi
fi

TEMP_SQL_FILE=""
cleanup() {
  if [ -n "$TEMP_SQL_FILE" ] && [ -f "$TEMP_SQL_FILE" ]; then
    rm -f "$TEMP_SQL_FILE"
  fi
}
trap cleanup EXIT

if [[ "$BACKUP_FILE" == *.gz ]]; then
  TEMP_SQL_FILE="$(mktemp "${SCRIPT_DIR}/restore_tmp_XXXXXX.sql")"
  gunzip -c "$BACKUP_FILE" > "$TEMP_SQL_FILE"
  SQL_FILE="$TEMP_SQL_FILE"
else
  SQL_FILE="$BACKUP_FILE"
fi

echo "🔄 Đang tạo database nếu chưa tồn tại..."
run_mysql_command "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "🔄 Đang phục hồi dữ liệu từ $1..."
restore_from_file "$SQL_FILE"

echo "✅ Phục hồi database thành công!"
echo "📌 Gợi ý tiếp theo:"
echo "   1. Nếu đây là DB cũ trước patch mới, hãy chạy thêm migration 031 và 032 nếu cần."
echo "   2. Chạy 'npm run seed:demo' để bổ sung giao dịch demo nếu muốn."
