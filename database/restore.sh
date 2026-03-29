#!/bin/bash
# ============================================================
# Julie Cosmetics — Database Restore Script
# Phục hồi CSDL MySQL từ file backup
# ============================================================

# Cấu hình
DB_NAME="julie_cosmetics"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-}"
BACKUP_DIR="$(dirname "$0")/backups"

# Kiểm tra tham số
if [ $# -eq 0 ]; then
  echo "📋 Danh sách các bản backup có sẵn:"
  ls -lt "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null || echo "  (Chưa có bản backup nào)"
  echo ""
  echo "Cách sử dụng: ./restore.sh <tên_file_backup>"
  echo "Ví dụ: ./restore.sh backup_20260326_140000.sql.gz"
  exit 0
fi

BACKUP_FILE="${BACKUP_DIR}/$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Không tìm thấy file backup: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  CẢNH BÁO: Thao tác này sẽ XÓA TOÀN BỘ dữ liệu hiện tại trong database ${DB_NAME}"
echo "    và thay thế bằng dữ liệu từ backup: $1"
read -p "Bạn có chắc chắn? (y/N): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "❌ Đã hủy phục hồi"
  exit 0
fi

echo "🔄 Đang phục hồi database từ $1..."

# Giải nén nếu là file .gz
if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -k "$BACKUP_FILE"
  SQL_FILE="${BACKUP_FILE%.gz}"
else
  SQL_FILE="$BACKUP_FILE"
fi

# Thực hiện restore
if [ -z "$DB_PASS" ]; then
  mysql -u "$DB_USER" "$DB_NAME" < "$SQL_FILE"
else
  mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SQL_FILE"
fi

if [ $? -eq 0 ]; then
  echo "✅ Phục hồi database thành công!"
  # Xóa file SQL tạm nếu giải nén
  if [[ "$BACKUP_FILE" == *.gz ]]; then
    rm -f "$SQL_FILE"
  fi
else
  echo "❌ Lỗi phục hồi database!"
  exit 1
fi
