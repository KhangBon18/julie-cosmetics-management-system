USE julie_cosmetics;
SET NAMES utf8mb4;

ALTER TABLE employees
  MODIFY gender VARCHAR(10) NOT NULL DEFAULT 'Nam';

UPDATE employees
SET gender = CONVERT(BINARY CONVERT(gender USING latin1) USING utf8mb4)
WHERE gender COLLATE utf8mb4_bin LIKE '%áº%'
   OR gender COLLATE utf8mb4_bin LIKE '%á»%';

ALTER TABLE employees
  MODIFY gender ENUM('Nam', 'Nữ') NOT NULL DEFAULT 'Nam';

ALTER TABLE customers
  MODIFY gender VARCHAR(10) NULL;

UPDATE customers
SET gender = CONVERT(BINARY CONVERT(gender USING latin1) USING utf8mb4)
WHERE gender COLLATE utf8mb4_bin LIKE '%áº%'
   OR gender COLLATE utf8mb4_bin LIKE '%á»%';

ALTER TABLE customers
  MODIFY gender ENUM('Nam', 'Nữ') NULL;
