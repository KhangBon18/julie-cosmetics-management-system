#!/bin/bash
# ============================================================
# Julie Cosmetics — Database Backup Script
# Sao lưu CSDL MySQL
# ============================================================

# Cấu hình
DB_NAME="julie_cosmetics"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-}"
BACKUP_DIR="$(dirname "$0")/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}.sql"

# Tạo thư mục backup nếu chưa có
mkdir -p "$BACKUP_DIR"

echo "🔄 Đang sao lưu database ${DB_NAME}..."

# Thực hiện backup
if [ -z "$DB_PASS" ]; then
  mysqldump -u "$DB_USER" "$DB_NAME" --routines --triggers > "$BACKUP_FILE"
else
  mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" --routines --triggers > "$BACKUP_FILE"
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
