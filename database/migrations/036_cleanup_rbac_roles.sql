-- Migration 036: remove unused legacy roles with zero permissions

SELECT r.role_id, r.role_name, COUNT(DISTINCT u.user_id) AS user_count
FROM roles r
LEFT JOIN users u ON u.role_id = r.role_id AND u.deleted_at IS NULL
LEFT JOIN role_permissions rp ON rp.role_id = r.role_id
WHERE r.role_id = 8
GROUP BY r.role_id, r.role_name;

DELETE FROM role_permissions
WHERE role_id = 8;

DELETE FROM roles
WHERE role_id = 8
  AND role_name = 'QuQuan tri vien'
  AND NOT EXISTS (
    SELECT 1
    FROM users u
    WHERE u.role_id = roles.role_id
      AND u.deleted_at IS NULL
  );
