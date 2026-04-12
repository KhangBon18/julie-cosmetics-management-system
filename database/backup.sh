#!/bin/bash
# ============================================================
# Julie Cosmetics — Database Backup Script
# Sao lưu CSDL MySQL
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Nạp cấu hình env nếu có để script chạy ổn cả khi gọi trực tiếp từ terminal
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

# Cấu hình
DB_NAME="${DB_NAME:-julie_cosmetics}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3307}"
DB_USER="${DB_USER:-julie_app}"
DB_PASS="${DB_PASSWORD:-${DB_PASS:-}}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-root}"
MYSQL_CONTAINER="${MYSQL_CONTAINER:-julie_mysql}"
BACKUP_DIR="${SCRIPT_DIR}/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}.sql"

# Tạo thư mục backup nếu chưa có
mkdir -p "$BACKUP_DIR"

echo "🔄 Đang sao lưu database ${DB_NAME}..."

# Thực hiện backup bằng local mysqldump nếu có, fallback sang Docker container nếu cần
if command -v mysqldump >/dev/null 2>&1; then
  if [ -z "$DB_PASS" ]; then
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" --routines --triggers --no-tablespaces > "$BACKUP_FILE"
  else
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" --routines --triggers --no-tablespaces > "$BACKUP_FILE"
  fi
elif command -v docker >/dev/null 2>&1 && docker ps -a --format '{{.Names}}' | grep -qx "$MYSQL_CONTAINER"; then
  docker exec "$MYSQL_CONTAINER" mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME" --routines --triggers --no-tablespaces > "$BACKUP_FILE"
else
  echo "❌ Không tìm thấy mysqldump local hoặc container ${MYSQL_CONTAINER} để sao lưu!"
  exit 1
fi

if [ $? -eq 0 ]; then
  # Nén file backup
  gzip "$BACKUP_FILE"
  echo "✅ Sao lưu thành công: ${BACKUP_FILE}.gz"
  echo "📁 Kích thước: $(du -h "${BACKUP_FILE}.gz" | cut -f1)"
  
  # Xóa backup cũ hơn 30 ngày
  find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete
  echo "🧹 Đã xóa các bản backup cũ hơn 30 ngày"
else
  echo "❌ Lỗi sao lưu database!"
  exit 1
fi
