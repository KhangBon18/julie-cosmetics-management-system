-- MySQL dump 10.13  Distrib 9.6.0, for macos15.7 (arm64)
--
-- Host: localhost    Database: julie_cosmetics
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '498ef6fc-2378-11f1-92e0-e56c6dde14c4:1-315';

--
-- Table structure for table `brands`
--

DROP TABLE IF EXISTS `brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `brands` (
  `brand_id` int NOT NULL AUTO_INCREMENT,
  `brand_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `origin_country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`brand_id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Thương hiệu mỹ phẩm';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brands`
--

LOCK TABLES `brands` WRITE;
/*!40000 ALTER TABLE `brands` DISABLE KEYS */;
INSERT INTO `brands` VALUES (1,'L\'Oréal Paris','Pháp','Tập đoàn mỹ phẩm hàng đầu thế giới','2026-03-28 01:19:46'),(2,'Maybelline','Mỹ','Thương hiệu makeup phổ biến toàn cầu','2026-03-28 01:19:46'),(3,'Innisfree','Hàn Quốc','Skincare thuần chay từ đảo Jeju','2026-03-28 01:19:46'),(4,'The Ordinary','Canada','Skincare hiệu quả với giá phải chăng','2026-03-28 01:19:46'),(5,'Laneige','Hàn Quốc','Chuyên gia độ ẩm và chăm sóc da','2026-03-28 01:19:46'),(6,'CeraVe','Mỹ','Được bác sĩ da liễu khuyên dùng','2026-03-28 01:19:46'),(7,'Bioderma','Pháp','Dược mỹ phẩm nổi tiếng','2026-03-28 01:19:46'),(8,'Sulwhasoo','Hàn Quốc','Luxury skincare thảo dược Đông y','2026-03-28 01:19:46'),(9,'MAC','Mỹ','Makeup chuyên nghiệp đẳng cấp','2026-03-28 01:19:46'),(10,'Clinique','Mỹ','Skincare & makeup không gây dị ứng','2026-03-28 01:19:46'),(11,'Shiseido','Nhật Bản','Mỹ phẩm cao cấp Nhật Bản','2026-03-28 01:19:46'),(12,'Estée Lauder','Mỹ','Thương hiệu sang trọng hàng đầu','2026-03-28 01:19:46'),(13,'Neutrogena','Mỹ','Chăm sóc da được bác sĩ tin dùng','2026-03-28 01:19:46'),(14,'Nivea','Đức','Chăm sóc da và cơ thể phổ biến','2026-03-28 01:19:46'),(15,'Dove','Anh','Làm đẹp và chăm sóc cơ thể dịu nhẹ','2026-03-28 01:19:46');
/*!40000 ALTER TABLE `brands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `parent_id` int DEFAULT NULL,
  `category_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`category_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh mục sản phẩm';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,NULL,'Skincare','Chăm sóc da mặt','2026-03-28 01:19:46'),(2,NULL,'Makeup','Trang điểm','2026-03-28 01:19:46'),(3,NULL,'Perfume','Nước hoa','2026-03-28 01:19:46'),(4,NULL,'Haircare','Chăm sóc tóc','2026-03-28 01:19:46'),(5,NULL,'Body Care','Chăm sóc cơ thể','2026-03-28 01:19:46'),(6,NULL,'Men\'s Care','Chăm sóc nam giới','2026-03-28 01:19:46'),(10,1,'Sữa rửa mặt','Cleanser, gel rửa mặt','2026-03-28 01:19:46'),(11,1,'Toner','Nước hoa hồng, toner cân bằng','2026-03-28 01:19:46'),(12,1,'Serum & Tinh chất','Serum dưỡng, ampoule, tinh chất','2026-03-28 01:19:46'),(13,1,'Kem dưỡng ẩm','Moisturizer, kem dưỡng','2026-03-28 01:19:46'),(14,1,'Kem chống nắng','Sunscreen, UV protection','2026-03-28 01:19:46'),(15,1,'Mặt nạ','Sheet mask, sleeping mask, clay mask','2026-03-28 01:19:46'),(16,1,'Kem mắt','Eye cream, eye serum','2026-03-28 01:19:46'),(17,1,'Tẩy trang','Nước tẩy trang, dầu tẩy trang','2026-03-28 01:19:46'),(20,2,'Kem nền & Cushion','Foundation, BB cream, cushion','2026-03-28 01:19:46'),(21,2,'Phấn phủ','Powder, setting powder','2026-03-28 01:19:46'),(22,2,'Son môi','Lipstick, lip tint, lip gloss','2026-03-28 01:19:46'),(23,2,'Mascara','Mascara, eyelash','2026-03-28 01:19:46'),(24,2,'Kẻ mắt','Eyeliner, eye pencil','2026-03-28 01:19:46'),(25,2,'Phấn mắt','Eyeshadow palette','2026-03-28 01:19:46'),(26,2,'Má hồng','Blush, bronzer, highlighter','2026-03-28 01:19:46'),(27,2,'Che khuyết điểm','Concealer','2026-03-28 01:19:46'),(30,3,'Nước hoa nữ','Women fragrance','2026-03-28 01:19:46'),(31,3,'Nước hoa nam','Men fragrance','2026-03-28 01:19:46'),(32,3,'Body mist','Xịt thơm toàn thân','2026-03-28 01:19:46'),(40,4,'Dầu gội','Shampoo','2026-03-28 01:19:46'),(41,4,'Dầu xả','Conditioner','2026-03-28 01:19:46'),(42,4,'Ủ tóc & Serum tóc','Hair mask, hair serum, hair oil','2026-03-28 01:19:46'),(50,5,'Sữa tắm','Body wash, shower gel','2026-03-28 01:19:46'),(51,5,'Dưỡng thể','Body lotion, body cream','2026-03-28 01:19:46'),(52,5,'Tẩy tế bào chết','Body scrub, exfoliator','2026-03-28 01:19:46'),(60,6,'Rửa mặt nam','Men cleanser','2026-03-28 01:19:46'),(61,6,'Dưỡng da nam','Men moisturizer, aftershave','2026-03-28 01:19:46'),(62,6,'Lăn khử mùi','Deodorant','2026-03-28 01:19:46');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `customer_id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `gender` enum('Nam','Nữ') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `membership_tier` enum('standard','silver','gold') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'standard',
  `total_points` int NOT NULL DEFAULT '0',
  `total_spent` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Khách hàng thành viên CRM';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'Nguyễn Thị Lan','0961111111','lan.nguyen@gmail.com',NULL,'12 Bà Triệu, Q1, TP.HCM','Nữ','1995-03-12','silver',239,2424400.00,'2026-03-26 08:28:54'),(2,'Trần Thị Bình','0962222222','binh.tran@gmail.com',NULL,'45 Ngô Đức Kế, Q1, TP.HCM','Nữ','1998-07-25','silver',133,1335740.00,'2026-03-26 08:28:54'),(3,'Lê Văn Hùng','0963333333','hung.le@gmail.com',NULL,'78 Phan Bội Châu, Q1, TP.HCM','Nam','1992-11-08','silver',150,1511160.00,'2026-03-26 08:28:54'),(4,'Phạm Thị Thu','0964444444','thu.pham@gmail.com',NULL,'90 Hai Bà Trưng, Q3, TP.HCM','Nữ','2000-01-15','standard',51,519400.00,'2026-03-26 08:28:54'),(5,'Vũ Minh Châu','0965555555','chau.vu@gmail.com',NULL,'33 Điện Biên Phủ, BT, TP.HCM','Nữ','1997-09-20','standard',57,575000.00,'2026-03-26 08:28:54'),(6,'Đoàn Thị Hoa','0966666666','hoa.doan@gmail.com',NULL,'56 Trần Hưng Đạo, Q5, TP.HCM','Nữ','1990-06-14','silver',217,2173600.00,'2026-03-26 08:28:54'),(7,'Ngô Thanh Long','0967777777','long.ngo@gmail.com',NULL,'102 Lý Thường Kiệt, Q10, TP.HCM','Nam','1988-12-03','standard',53,544880.00,'2026-03-26 08:28:54'),(8,'Hoàng Thị Ngọc','0968888888','ngoc.hoang@gmail.com',NULL,'25 Nguyễn Văn Cừ, Q5, TP.HCM','Nữ','1999-04-28','standard',70,950000.00,'2026-03-26 08:28:54'),(9,'Nguy','0901111222','test@julie.vn','$2a$10$Ma6fSzi3TN02Y0R0FoUBe.I.CTYMaqeAbJTEpUN.rzo2eYzLT9UoG',NULL,NULL,NULL,'standard',0,0.00,'2026-03-28 01:53:46'),(10,'AA','0378261282','aa@gmail.com','$2a$10$hcWSIoiJgLY86yt4zUyhrO7TczkXCin20X9rOLmdgWQjcbhKOLVOS',NULL,NULL,NULL,'standard',0,0.00,'2026-03-28 01:58:36'),(11,'Khang','0372869725','khangisbon@gmail.com','$2a$10$e5wDDUXDPsagS6AC452HxuQG1P8M/zFECUyeLliKrEIKTd8XOxpTe',NULL,NULL,NULL,'standard',0,0.00,'2026-03-28 01:59:27');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_positions`
--

DROP TABLE IF EXISTS `employee_positions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_positions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `position_id` int NOT NULL,
  `effective_date` date NOT NULL COMMENT 'Ngày nhận chức vụ',
  `end_date` date DEFAULT NULL COMMENT 'NULL = đang giữ chức vụ này',
  `salary_at_time` decimal(12,2) NOT NULL COMMENT 'Lương tại thời điểm nhận chức vụ',
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `position_id` (`position_id`),
  CONSTRAINT `employee_positions_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  CONSTRAINT `employee_positions_ibfk_2` FOREIGN KEY (`position_id`) REFERENCES `positions` (`position_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lịch sử chức vụ nhân viên';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_positions`
--

LOCK TABLES `employee_positions` WRITE;
/*!40000 ALTER TABLE `employee_positions` DISABLE KEYS */;
INSERT INTO `employee_positions` VALUES (1,1,1,'2022-01-01',NULL,15000000.00,'Quản lý cửa hàng từ ngày thành lập','2026-03-26 08:28:54'),(2,2,2,'2022-03-15','2023-06-30',7500000.00,'Vào với vị trí nhân viên thử việc','2026-03-26 08:28:54'),(3,2,2,'2023-07-01',NULL,8000000.00,'Tăng lương sau khi chính thức','2026-03-26 08:28:54'),(4,3,2,'2022-06-01',NULL,8000000.00,'Nhân viên bán hàng','2026-03-26 08:28:54'),(5,4,3,'2022-04-01',NULL,7500000.00,'Thủ kho','2026-03-26 08:28:54'),(6,5,2,'2023-01-10',NULL,8000000.00,'Nhân viên bán hàng','2026-03-26 08:28:54'),(7,6,1,'2021-09-01','2023-12-31',14000000.00,'Đã nghỉ việc cuối năm 2023','2026-03-26 08:28:54');
/*!40000 ALTER TABLE `employee_positions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `employee_id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `gender` enum('Nam','Nữ') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Nam',
  `date_of_birth` date DEFAULT NULL,
  `hire_date` date NOT NULL,
  `base_salary` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Lương hiện tại (đồng bộ với employee_positions mới nhất)',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Thông tin nhân viên';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (1,'Nguyễn Thị Julie','julie@juliecosmetics.vn','0901234567','123 Nguyễn Huệ, Q1, TP.HCM','Nữ','1990-05-15','2022-01-01',15000000.00,'active','2026-03-26 08:28:54'),(2,'Trần Văn Nam','nam.tran@juliecosmetics.vn','0912345678','456 Lê Lợi, Q1, TP.HCM','Nam','1995-08-20','2022-03-15',8000000.00,'active','2026-03-26 08:28:54'),(3,'Lê Thị Hương','huong.le@juliecosmetics.vn','0923456789','789 Điện Biên Phủ, Q3, TP.HCM','Nữ','1998-02-10','2022-06-01',8000000.00,'active','2026-03-26 08:28:54'),(4,'Phạm Văn Kho','kho.pham@juliecosmetics.vn','0934567890','321 Cách Mạng Tháng 8, Q10, TP.HCM','Nam','1996-11-25','2022-04-01',7500000.00,'active','2026-03-26 08:28:54'),(5,'Vũ Thị Mai','mai.vu@juliecosmetics.vn','0945678901','654 Nguyễn Thị Minh Khai, Q3','Nữ','1997-07-18','2023-01-10',8000000.00,'active','2026-03-26 08:28:54'),(6,'Đặng Hữu Phúc','phuc.dang@juliecosmetics.vn','0956789012','147 Võ Văn Tần, Q3, TP.HCM','Nam','1993-04-30','2021-09-01',15000000.00,'inactive','2026-03-26 08:28:54');
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `import_receipt_items`
--

DROP TABLE IF EXISTS `import_receipt_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `import_receipt_items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `receipt_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(12,2) NOT NULL,
  PRIMARY KEY (`item_id`),
  KEY `receipt_id` (`receipt_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `import_receipt_items_ibfk_1` FOREIGN KEY (`receipt_id`) REFERENCES `import_receipts` (`receipt_id`) ON DELETE CASCADE,
  CONSTRAINT `import_receipt_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Chi tiết phiếu nhập kho';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `import_receipt_items`
--

LOCK TABLES `import_receipt_items` WRITE;
/*!40000 ALTER TABLE `import_receipt_items` DISABLE KEYS */;
INSERT INTO `import_receipt_items` VALUES (9,4,128,16,140000.00),(10,4,167,49,50000.00),(11,4,151,13,110000.00),(12,4,122,21,200000.00),(13,4,135,21,200000.00),(14,5,51,43,65000.00),(15,5,101,47,130000.00),(16,5,135,23,200000.00),(17,6,54,13,80000.00),(18,6,170,34,50000.00),(19,6,96,21,60000.00),(20,6,145,48,550000.00),(21,6,61,19,140000.00),(22,6,146,27,170000.00),(23,7,51,40,65000.00),(24,7,83,43,120000.00),(25,7,96,30,60000.00),(26,7,135,25,200000.00),(27,8,111,39,200000.00),(28,8,81,27,110000.00),(29,8,96,21,60000.00),(30,8,128,45,140000.00);
/*!40000 ALTER TABLE `import_receipt_items` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_import_item_insert` AFTER INSERT ON `import_receipt_items` FOR EACH ROW BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity + NEW.quantity,
      import_price   = NEW.unit_price
  WHERE product_id = NEW.product_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `import_receipts`
--

DROP TABLE IF EXISTS `import_receipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `import_receipts` (
  `receipt_id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL,
  `created_by` int DEFAULT NULL,
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`receipt_id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `import_receipts_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`),
  CONSTRAINT `import_receipts_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Phiếu nhập kho';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `import_receipts`
--

LOCK TABLES `import_receipts` WRITE;
/*!40000 ALTER TABLE `import_receipts` DISABLE KEYS */;
INSERT INTO `import_receipts` VALUES (4,3,1,14520000.00,'Nhập hàng đầu năm','2026-01-05 03:00:00'),(5,3,1,13505000.00,'Bổ sung hàng Tết','2026-01-20 03:00:00'),(6,2,1,37650000.00,'Nhập hàng tháng 2','2026-02-10 03:00:00'),(7,1,1,14560000.00,'Nhập hàng tháng 3','2026-03-01 03:00:00'),(8,1,1,18330000.00,'Bổ sung tồn kho','2026-03-15 03:00:00');
/*!40000 ALTER TABLE `import_receipts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_items`
--

DROP TABLE IF EXISTS `invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  PRIMARY KEY (`item_id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`) ON DELETE CASCADE,
  CONSTRAINT `invoice_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Chi tiết hóa đơn bán hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_items`
--

LOCK TABLES `invoice_items` WRITE;
/*!40000 ALTER TABLE `invoice_items` DISABLE KEYS */;
INSERT INTO `invoice_items` VALUES (29,12,65,2,139000.00,278000.00),(30,12,136,1,320000.00,320000.00),(31,12,109,1,1690000.00,1690000.00),(32,13,137,1,440000.00,440000.00),(33,13,55,1,115000.00,115000.00),(34,14,148,1,189000.00,189000.00),(35,15,166,2,85000.00,170000.00),(36,16,91,1,149000.00,149000.00),(37,17,68,2,99000.00,198000.00),(38,17,151,1,209000.00,209000.00),(39,18,157,2,105000.00,210000.00),(40,19,165,2,35000.00,70000.00),(41,19,89,2,145000.00,290000.00),(42,20,137,1,440000.00,440000.00),(43,20,165,2,35000.00,70000.00),(44,20,84,2,149000.00,298000.00),(45,21,63,1,159000.00,159000.00),(46,21,68,1,99000.00,99000.00),(47,21,161,2,59000.00,118000.00),(48,22,55,1,115000.00,115000.00),(49,22,114,2,290000.00,580000.00),(50,23,156,1,135000.00,135000.00),(51,23,137,1,440000.00,440000.00),(52,24,136,1,320000.00,320000.00),(53,25,84,2,149000.00,298000.00),(54,25,72,1,189000.00,189000.00),(55,26,151,2,209000.00,418000.00),(56,26,156,1,135000.00,135000.00),(57,27,161,1,59000.00,59000.00),(58,27,114,1,290000.00,290000.00),(59,27,151,2,209000.00,418000.00),(60,28,114,2,290000.00,580000.00),(61,28,136,2,320000.00,640000.00),(62,29,84,1,149000.00,149000.00);
/*!40000 ALTER TABLE `invoice_items` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_invoice_item_insert` AFTER INSERT ON `invoice_items` FOR EACH ROW BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE product_id = NEW.product_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `invoice_id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL COMMENT 'NULL = khách vãng lai',
  `created_by` int DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `final_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `points_earned` int NOT NULL DEFAULT '0',
  `payment_method` enum('cash','card','transfer') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cash',
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`invoice_id`),
  KEY `customer_id` (`customer_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE SET NULL,
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hóa đơn bán hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES (12,6,1,2288000.00,5.00,114400.00,2173600.00,217,'transfer',NULL,'2026-01-08 02:30:00'),(13,2,1,555000.00,2.00,11100.00,543900.00,54,'card',NULL,'2026-01-12 07:15:00'),(14,1,1,189000.00,5.00,9450.00,179550.00,17,'card',NULL,'2026-01-18 04:00:00'),(15,NULL,1,170000.00,0.00,0.00,170000.00,17,'transfer',NULL,'2026-01-22 09:45:00'),(16,NULL,1,149000.00,0.00,0.00,149000.00,14,'cash',NULL,'2026-01-28 03:20:00'),(17,7,1,407000.00,2.00,8140.00,398860.00,39,'transfer',NULL,'2026-02-03 02:00:00'),(18,4,1,210000.00,2.00,4200.00,205800.00,20,'card',NULL,'2026-02-08 06:30:00'),(19,3,1,360000.00,2.00,7200.00,352800.00,35,'card',NULL,'2026-02-14 03:00:00'),(20,2,1,808000.00,2.00,16160.00,791840.00,79,'cash',NULL,'2026-02-19 08:00:00'),(21,1,1,376000.00,5.00,18800.00,357200.00,35,'card',NULL,'2026-02-25 04:30:00'),(22,3,1,695000.00,2.00,13900.00,681100.00,68,'transfer',NULL,'2026-03-02 02:45:00'),(23,5,1,575000.00,0.00,0.00,575000.00,57,'transfer',NULL,'2026-03-05 07:00:00'),(24,4,1,320000.00,2.00,6400.00,313600.00,31,'cash',NULL,'2026-03-10 04:15:00'),(25,3,1,487000.00,2.00,9740.00,477260.00,47,'transfer',NULL,'2026-03-15 09:30:00'),(26,NULL,1,553000.00,0.00,0.00,553000.00,55,'cash',NULL,'2026-03-20 03:00:00'),(27,1,1,767000.00,5.00,38350.00,728650.00,72,'card',NULL,'2026-03-22 06:00:00'),(28,1,1,1220000.00,5.00,61000.00,1159000.00,115,'cash',NULL,'2026-03-25 02:30:00'),(29,7,1,149000.00,2.00,2980.00,146020.00,14,'cash',NULL,'2026-03-27 08:45:00');
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_invoice_after_insert` AFTER INSERT ON `invoices` FOR EACH ROW BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE customers
    SET total_points = total_points + NEW.points_earned,
        total_spent  = total_spent  + NEW.final_total,
        membership_tier = CASE
          WHEN (total_points + NEW.points_earned) >= 500 THEN 'gold'
          WHEN (total_points + NEW.points_earned) >= 100 THEN 'silver'
          ELSE 'standard'
        END
    WHERE customer_id = NEW.customer_id;
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `leave_requests`
--

DROP TABLE IF EXISTS `leave_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_requests` (
  `request_id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `leave_type` enum('annual','sick','maternity','unpaid') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'annual',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_days` int NOT NULL DEFAULT '1',
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `reject_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`request_id`),
  KEY `employee_id` (`employee_id`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  CONSTRAINT `leave_requests_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Đơn xin nghỉ phép';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_requests`
--

LOCK TABLES `leave_requests` WRITE;
/*!40000 ALTER TABLE `leave_requests` DISABLE KEYS */;
INSERT INTO `leave_requests` VALUES (1,2,'annual','2026-03-10','2026-03-11',2,'Nghỉ phép năm đã đăng ký từ đầu năm','approved',1,'2026-03-05 02:00:00',NULL,'2026-03-26 08:28:54'),(2,3,'sick','2026-03-15','2026-03-15',1,'Bị sốt cảm, có giấy bác sĩ','approved',1,'2026-03-15 01:00:00',NULL,'2026-03-26 08:28:54'),(3,5,'annual','2026-04-05','2026-04-07',3,'Du lịch gia đình đã lên kế hoạch trước','pending',NULL,NULL,NULL,'2026-03-26 08:28:54'),(4,4,'unpaid','2026-03-28','2026-03-28',1,'Có việc gia đình đột xuất','rejected',1,'2026-03-25 03:00:00',NULL,'2026-03-26 08:28:54');
/*!40000 ALTER TABLE `leave_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `positions`
--

DROP TABLE IF EXISTS `positions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `positions` (
  `position_id` int NOT NULL AUTO_INCREMENT,
  `position_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Manager / NV Bán hàng / Thủ kho',
  `base_salary` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Lương cơ bản theo chức vụ',
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`position_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh mục chức vụ';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `positions`
--

LOCK TABLES `positions` WRITE;
/*!40000 ALTER TABLE `positions` DISABLE KEYS */;
INSERT INTO `positions` VALUES (1,'Manager',15000000.00,'Quản lý cửa hàng, phê duyệt đơn nghỉ phép, xem báo cáo toàn hệ thống','2026-03-26 08:28:54'),(2,'Nhân viên Bán hàng',8000000.00,'Tư vấn và bán hàng trực tiếp, lập hóa đơn cho khách hàng','2026-03-26 08:28:54'),(3,'Thủ kho',7500000.00,'Quản lý nhập/xuất kho, lập phiếu nhập hàng','2026-03-26 08:28:54'),(4,'Kế toán',9000000.00,'Quản lý tài chính, kiểm tra báo cáo doanh thu','2026-03-26 08:28:54');
/*!40000 ALTER TABLE `positions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `product_id` int NOT NULL AUTO_INCREMENT,
  `product_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand_id` int NOT NULL,
  `category_id` int NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `skin_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Da dầu / Da khô / Da hỗn hợp / Mọi loại da',
  `volume` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'VD: 50ml, 30g',
  `import_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `sell_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `stock_quantity` int NOT NULL DEFAULT '0',
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`),
  KEY `brand_id` (`brand_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`brand_id`),
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=173 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sản phẩm mỹ phẩm';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (41,'CeraVe Foaming Facial Cleanser',6,10,'Sữa rửa mặt tạo bọt cho da dầu, chứa 3 ceramides thiết yếu và niacinamide','Da dầu','236ml',145000.00,249000.00,55,'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(42,'CeraVe Hydrating Cleanser',6,10,'Sữa rửa mặt dạng kem dịu nhẹ cho da khô, không làm mất độ ẩm tự nhiên','Da khô','236ml',145000.00,249000.00,48,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(43,'CeraVe Moisturizing Cream',6,13,'Kem dưỡng ẩm phục hồi hàng rào bảo vệ da với ceramides và hyaluronic acid','Mọi loại da','340g',190000.00,345000.00,60,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(44,'CeraVe PM Facial Moisturizing Lotion',6,13,'Kem dưỡng ẩm ban đêm nhẹ với niacinamide giúp phục hồi da','Mọi loại da','52ml',140000.00,239000.00,42,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(45,'CeraVe Eye Repair Cream',6,16,'Kem mắt giảm quầng thâm và bọng mắt với ceramides','Mọi loại da','14.2g',95000.00,179000.00,30,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(46,'CeraVe Hydrating Micellar Water',6,17,'Nước tẩy trang dưỡng ẩm với ceramides, không cần rửa lại','Da khô','296ml',110000.00,199000.00,38,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(47,'CeraVe Resurfacing Retinol Serum',6,12,'Serum retinol giúp làm mờ vết thâm và cải thiện kết cấu da','Mọi loại da','30ml',130000.00,229000.00,25,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(48,'CeraVe Mineral Sunscreen SPF50',6,14,'Kem chống nắng vật lý phổ rộng SPF50, không gây bít tắc lỗ chân lông','Da nhạy cảm','75ml',120000.00,215000.00,35,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(49,'CeraVe SA Smoothing Cleanser',6,10,'Sữa rửa mặt chứa salicylic acid giúp tẩy da chết nhẹ và thông thoáng lỗ chân lông','Da dầu/mụn','236ml',155000.00,269000.00,40,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(50,'CeraVe Skin Renewing Night Cream',6,13,'Kem dưỡng ban đêm chứa biomimetic peptides giúp da săn chắc','Da thường/khô','48g',170000.00,299000.00,22,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(51,'The Ordinary Niacinamide 10% + Zinc 1%',4,12,'Serum kiểm soát dầu và se khít lỗ chân lông','Da dầu/hỗn hợp','30ml',65000.00,135000.00,153,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(52,'The Ordinary Hyaluronic Acid 2% + B5',4,12,'Serum cấp ẩm sâu với hyaluronic acid đa phân tử','Mọi loại da','30ml',55000.00,119000.00,65,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(53,'The Ordinary AHA 30% + BHA 2% Peeling Solution',4,12,'Mặt nạ peel hóa học giúp tẩy da chết, sáng da','Da thường (không nhạy cảm)','30ml',70000.00,149000.00,45,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(54,'The Ordinary Retinol 0.5% in Squalane',4,12,'Serum retinol chống lão hóa trong dầu squalane','Da khô/thường','30ml',80000.00,165000.00,51,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(55,'The Ordinary Caffeine Solution 5% + EGCG',4,16,'Serum giảm quầng thâm và bọng mắt chứa caffeine','Mọi loại da','30ml',55000.00,115000.00,48,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(56,'The Ordinary Squalane Cleanser',4,10,'Sữa rửa mặt dạng dầu chuyển gel, tẩy trang nhẹ nhàng','Mọi loại da','50ml',60000.00,125000.00,42,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(57,'The Ordinary Natural Moisturizing Factors + HA',4,13,'Kem dưỡng ẩm với các yếu tố dưỡng ẩm tự nhiên','Mọi loại da','30ml',50000.00,109000.00,55,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(58,'The Ordinary Glycolic Acid 7% Toning Solution',4,11,'Toner tẩy da chết hóa học với glycolic acid','Da thường/dầu','240ml',75000.00,159000.00,35,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(59,'The Ordinary Vitamin C Suspension 23% + HA',4,12,'Serum vitamin C nồng độ cao giúp sáng da','Mọi loại da','30ml',60000.00,129000.00,40,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(60,'The Ordinary Azelaic Acid Suspension 10%',4,12,'Gel azelaic acid giảm mụn và làm đều màu da','Da dầu/mụn','30ml',70000.00,145000.00,32,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(61,'Innisfree Green Tea Seed Serum',3,12,'Serum dưỡng ẩm trà xanh Jeju cung cấp độ ẩm cho da','Mọi loại da','80ml',140000.00,259000.00,64,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(62,'Innisfree Jeju Volcanic Pore Cleansing Foam',3,10,'Sữa rửa mặt đất sét núi lửa Jeju kiểm soát dầu','Da dầu/hỗn hợp','150ml',80000.00,149000.00,60,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(63,'Innisfree Green Tea Balancing Toner',3,11,'Toner cân bằng da chiết xuất trà xanh Jeju','Mọi loại da','200ml',85000.00,159000.00,54,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(64,'Innisfree Daily UV Defense Sunscreen SPF36',3,14,'Kem chống nắng hằng ngày nhẹ, không gây nhờn','Mọi loại da','50ml',95000.00,179000.00,40,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(65,'Innisfree Super Volcanic Pore Clay Mask',3,15,'Mặt nạ đất sét núi lửa Jeju hút sạch bã nhờn','Da dầu','100ml',75000.00,139000.00,48,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(66,'Innisfree Green Tea Seed Cream',3,13,'Kem dưỡng ẩm trà xanh Jeju cho da căng mọng','Da thường/khô','50ml',130000.00,239000.00,35,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(67,'Innisfree Jeju Cherry Blossom Tone Up Cream',3,13,'Kem dưỡng nâng tông da với hoa anh đào Jeju','Mọi loại da','50ml',110000.00,199000.00,42,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(68,'Innisfree No Sebum Mineral Powder',3,21,'Phấn phủ kiểm soát dầu với bột khoáng Jeju','Da dầu','5g',55000.00,99000.00,77,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(69,'Innisfree Vivid Cotton Ink Lip Tint',3,22,'Son tint lì mỏng nhẹ như cotton','N/A','4g',60000.00,115000.00,65,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(70,'Innisfree My Real Squeeze Mask (10 miếng)',3,15,'Mặt nạ giấy chiết xuất tự nhiên, combo 10 miếng','Mọi loại da','10 sheets',90000.00,169000.00,70,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(71,'Laneige Water Sleeping Mask',5,15,'Mặt nạ ngủ dưỡng ẩm sâu, thức dậy da căng mọng','Da thường/khô','70ml',140000.00,259000.00,35,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(72,'Laneige Lip Sleeping Mask Berry',5,22,'Mặt nạ ngủ môi hương berry dưỡng ẩm suốt đêm','N/A','20g',100000.00,189000.00,54,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(73,'Laneige Water Bank Blue Hyaluronic Cream',5,13,'Kem dưỡng cấp ẩm sâu với blue hyaluronic acid','Da khô/thường','50ml',180000.00,329000.00,28,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(74,'Laneige Cream Skin Cera-mide Toner & Moisturizer',5,11,'Toner-kem dưỡng 2 trong 1 chứa ceramide','Mọi loại da','170ml',150000.00,279000.00,40,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(75,'Laneige Neo Cushion Glow',5,20,'Cushion cho lớp nền bóng mịn tự nhiên với SPF50','Da thường/khô','15g',170000.00,319000.00,25,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(76,'Laneige Radian-C Cream',5,13,'Kem dưỡng sáng da chứa vitamin C','Mọi loại da','30ml',160000.00,289000.00,30,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(77,'Laneige Water Bank Hydro Essence',5,12,'Tinh chất cấp ẩm 72h với green mineral water','Mọi loại da','70ml',170000.00,299000.00,32,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(78,'Laneige Bouncy & Firm Sleeping Mask',5,15,'Mặt nạ ngủ nâng cơ săn chắc','Da lão hóa','60ml',150000.00,269000.00,20,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(79,'L\'Oréal Paris True Match Foundation',1,20,'Kem nền mỏng mịn tự nhiên, 40 tông màu phù hợp mọi làn da','Mọi loại da','30ml',95000.00,189000.00,45,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(80,'L\'Oréal Paris Revitalift Laser X3 Serum',1,12,'Serum chống lão hóa với Pro-Xylane giúp giảm nếp nhăn','Da lão hóa','30ml',160000.00,299000.00,30,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(81,'L\'Oréal Paris UV Perfect Even Complexion SPF50',1,14,'Kem chống nắng nâng tông da với SPF50/PA++++','Mọi loại da','30ml',110000.00,209000.00,67,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(82,'L\'Oréal Paris Revitalift Crystal Micro-Essence',1,11,'Tinh chất dưỡng sáng da như pha lê với salicylic acid','Mọi loại da','65ml',120000.00,229000.00,38,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(83,'L\'Oréal Paris Infallible 24H Fresh Wear Foundation',1,20,'Kem nền 24h bền màu không trôi, finish mịn lì','Da dầu/hỗn hợp','30ml',120000.00,229000.00,78,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(84,'L\'Oréal Paris Rouge Signature Matte Lip Ink',1,22,'Son kem lì nhẹ như không, bền màu cả ngày','N/A','7ml',75000.00,149000.00,55,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(85,'L\'Oréal Paris Lash Paradise Mascara',1,23,'Mascara cho mi dày dài quyến rũ, công thức không vón cục','N/A','6.4ml',80000.00,159000.00,50,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(86,'L\'Oréal Paris Elseve Total Repair 5 Shampoo',1,40,'Dầu gội phục hồi tóc hư tổn với protein và ceramide','N/A','280ml',55000.00,99000.00,70,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(87,'L\'Oréal Paris Elseve Extraordinary Oil Conditioner',1,41,'Dầu xả dưỡng tóc với 6 loại tinh dầu quý','N/A','280ml',60000.00,109000.00,55,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(88,'L\'Oréal Paris Revitalift Eye Cream',1,16,'Kem mắt chống nhăn và giảm quầng thâm','Da lão hóa','15ml',130000.00,239000.00,25,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(89,'Maybelline Fit Me Matte + Poreless Foundation',2,20,'Kem nền lì mịn che phủ lỗ chân lông, 40 tông màu','Da dầu/hỗn hợp','30ml',75000.00,145000.00,53,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(90,'Maybelline Superstay Matte Ink Liquid Lipstick',2,22,'Son kem lì siêu bền 16h không trôi không phai','N/A','5ml',70000.00,139000.00,75,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(91,'Maybelline Lash Sensational Mascara',2,23,'Mascara làm dày và dài mi 10 lớp, dễ tẩy','N/A','9.5ml',75000.00,149000.00,59,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(92,'Maybelline Fit Me Concealer',2,27,'Kem che khuyết điểm tự nhiên, độ che phủ trung bình','Mọi loại da','6.8ml',50000.00,99000.00,65,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(93,'Maybelline Hyper Sharp Liner',2,24,'Bút kẻ mắt nước siêu mảnh 0.01mm, không lem','N/A','0.5g',65000.00,129000.00,50,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(94,'Maybelline Superstay 24H Skin Tint',2,20,'Kem nền nhẹ 24h bền màu, finish tự nhiên','Mọi loại da','30ml',80000.00,155000.00,40,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(95,'Maybelline The Nudes Eyeshadow Palette',2,25,'Bảng phấn mắt 12 màu nude tự nhiên','N/A','9.6g',90000.00,175000.00,35,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(96,'Maybelline Instant Age Rewind Concealer',2,27,'Kem che khuyết điểm xóa tuổi, dạng bọt biển','Mọi loại da','6ml',60000.00,119000.00,117,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(97,'Maybelline Fit Me Blush',2,26,'Phấn má hồng dạng nén tự nhiên, 8 tông màu','N/A','4.5g',55000.00,109000.00,50,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(98,'Maybelline Colossal Kajal Eyeliner',2,24,'Chì kẻ mắt đen đậm, không lem suốt 24h','N/A','0.35g',40000.00,79000.00,70,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(99,'Bioderma Sensibio H2O Micellar Water',7,17,'Nước tẩy trang cho da nhạy cảm, không cần rửa lại','Da nhạy cảm','250ml',110000.00,199000.00,65,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(100,'Bioderma Sensibio H2O Micellar Water 500ml',7,17,'Nước tẩy trang cỡ lớn cho da nhạy cảm','Da nhạy cảm','500ml',180000.00,329000.00,40,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(101,'Bioderma Sébium Foaming Gel',7,10,'Gel rửa mặt tạo bọt cho da dầu mụn','Da dầu/mụn','200ml',130000.00,239000.00,82,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(102,'Bioderma Hydrabio Serum',7,12,'Serum dưỡng ẩm sâu cho da mất nước','Da khô','40ml',180000.00,329000.00,25,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(103,'Bioderma Cicabio Cream',7,13,'Kem phục hồi da tổn thương, làm dịu kích ứng','Da nhạy cảm','40ml',120000.00,219000.00,30,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(104,'Bioderma Photoderm MAX Spray SPF50+',7,14,'Xịt chống nắng SPF50+ bảo vệ tối đa','Mọi loại da','200ml',170000.00,319000.00,28,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(105,'Bioderma Sébium H2O Micellar Water',7,17,'Nước tẩy trang cho da dầu mụn','Da dầu/mụn','250ml',115000.00,209000.00,50,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(106,'Bioderma Atoderm Intensive Baume',7,51,'Kem dưỡng thể phục hồi cho da rất khô và kích ứng','Da khô/nhạy cảm','200ml',150000.00,279000.00,32,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(107,'Sulwhasoo First Care Activating Serum VI',8,12,'Serum đầu bước dưỡng chất thảo dược Đông y','Mọi loại da','90ml',400000.00,750000.00,12,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(108,'Sulwhasoo Essential Comfort Moisturizing Cream',8,13,'Kem dưỡng ẩm cao cấp nhân sâm','Da thường/khô','50ml',350000.00,650000.00,15,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(109,'Sulwhasoo Concentrated Ginseng Renewing Cream',8,13,'Kem nhân sâm cô đặc chống lão hóa cao cấp','Da lão hóa','60ml',900000.00,1690000.00,7,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(110,'Sulwhasoo Essential Comfort Balancing Water',8,11,'Toner cân bằng dưỡng ẩm với thảo dược','Mọi loại da','150ml',250000.00,470000.00,18,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(111,'Sulwhasoo Snowise Brightening Cleanser',8,10,'Sữa rửa mặt sáng da với bạch truật','Mọi loại da','200ml',200000.00,390000.00,59,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(112,'Sulwhasoo Perfecting Cushion EX SPF50',8,20,'Cushion cao cấp nền mịn tự nhiên','Mọi loại da','15g',280000.00,520000.00,15,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(113,'Sulwhasoo Overnight Vitalizing Mask',8,15,'Mặt nạ ngủ dưỡng da với nhân sâm','Mọi loại da','120ml',230000.00,430000.00,18,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(114,'Sulwhasoo Essential Lip Serum Stick',8,22,'Son dưỡng môi cao cấp chiết xuất hoa trà và mật ong','N/A','3g',150000.00,290000.00,17,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(115,'MAC Matte Lipstick - Ruby Woo',9,22,'Son lì đỏ huyền thoại, best-seller toàn cầu','N/A','3g',200000.00,390000.00,40,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(116,'MAC Studio Fix Fluid Foundation SPF15',9,20,'Kem nền bán lì kiểm soát dầu, che phủ trung bình-cao','Da dầu/hỗn hợp','30ml',230000.00,450000.00,30,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(117,'MAC Powder Kiss Lipstick',9,22,'Son lì mỏng nhẹ như hôn gió, 18 màu','N/A','3g',190000.00,370000.00,35,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(118,'MAC Fix+ Setting Spray',9,21,'Xịt khóa nền đa công dụng, giữ lớp trang điểm 12h','Mọi loại da','100ml',170000.00,329000.00,25,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(119,'MAC Pro Longwear Paint Pot',9,25,'Phấn mắt dạng kem bền màu, làm base mắt hoàn hảo','N/A','5g',140000.00,270000.00,28,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(120,'MAC Strobe Cream',9,26,'Kem bắt sáng tạo hiệu ứng da glass skin','Mọi loại da','50ml',180000.00,349000.00,30,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(121,'MAC Prep + Prime Lip',9,22,'Kem lót môi giúp son bền và mịn hơn','N/A','1.7g',120000.00,230000.00,35,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(122,'MAC Mineralize Skinfinish Natural',9,21,'Phấn phủ khoáng tự nhiên, kiểm soát bóng dầu','Mọi loại da','10g',200000.00,390000.00,43,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(123,'Clinique Moisture Surge 72H Auto-Replenishing Hydrator',10,13,'Gel dưỡng ẩm 72h tự động bổ sung nước cho da','Mọi loại da','50ml',200000.00,389000.00,28,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(124,'Clinique Dramatically Different Moisturizing Gel',10,13,'Gel dưỡng ẩm cổ điển cho da dầu/hỗn hợp','Da dầu/hỗn hợp','125ml',170000.00,329000.00,35,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(125,'Clinique Take The Day Off Cleansing Balm',10,17,'Sáp tẩy trang tan chảy, làm sạch toàn bộ makeup','Mọi loại da','125ml',160000.00,299000.00,30,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(126,'Clinique All About Eyes',10,16,'Kem mắt giảm quầng thâm, bọng mắt và nếp nhăn li ti','Mọi loại da','15ml',180000.00,349000.00,25,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(127,'Clinique Even Better Clinical Brightening Serum',10,12,'Serum sáng da và làm mờ đốm nâu','Mọi loại da','30ml',250000.00,479000.00,20,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(128,'Clinique Pop Lip Colour + Primer',10,22,'Son thuần sắc kèm primer trong 1 thỏi','N/A','3.9g',140000.00,270000.00,99,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(129,'Clinique Almost Lipstick - Black Honey',10,22,'Son bóng trong suốt huyền thoại tông rượu vang','N/A','1.9g',130000.00,249000.00,42,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(130,'Clinique High Impact Mascara',10,23,'Mascara dày mi tác động cao, đen đậm','N/A','7ml',120000.00,229000.00,30,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(131,'Shiseido Ultimune Power Infusing Concentrate',11,12,'Tinh chất tăng cường sức mạnh miễn dịch cho da','Mọi loại da','50ml',450000.00,850000.00,15,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(132,'Shiseido Essential Energy Moisturizing Cream',11,13,'Kem dưỡng ẩm tái tạo năng lượng cho da mệt mỏi','Mọi loại da','50ml',280000.00,530000.00,20,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(133,'Shiseido Benefiance Wrinkle Smoothing Cream',11,13,'Kem chống nhăn với công nghệ ReNeura+','Da lão hóa','50ml',350000.00,660000.00,12,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(134,'Shiseido White Lucent Brightening Gel Cream',11,13,'Kem dưỡng sáng da dạng gel nhẹ','Mọi loại da','50ml',300000.00,570000.00,18,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(135,'Shiseido Perfect Protector SPF50+',11,14,'Kem chống nắng WetForce chống nước','Mọi loại da','50ml',200000.00,380000.00,94,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(136,'Shiseido ModernMatte Powder Lipstick',11,22,'Son lì dạng phấn nhẹ như lụa','N/A','4g',170000.00,320000.00,26,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(137,'Shiseido Synchro Skin Self-Refreshing Foundation',11,20,'Kem nền tự làm mới suốt cả ngày','Da dầu/hỗn hợp','30ml',230000.00,440000.00,19,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(138,'Shiseido Ginza Eau de Parfum',11,30,'Nước hoa nữ hương hoa magnolia và gỗ hinoki','N/A','50ml',500000.00,950000.00,10,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(139,'Estée Lauder Advanced Night Repair Serum',12,12,'Serum phục hồi da ban đêm huyền thoại','Mọi loại da','50ml',550000.00,1050000.00,15,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(140,'Estée Lauder Double Wear Foundation',12,20,'Kem nền 24h bền màu số 1 thế giới','Mọi loại da','30ml',270000.00,520000.00,25,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(141,'Estée Lauder Revitalizing Supreme+ Cream',12,13,'Kem dưỡng chống lão hóa đa công dụng','Mọi loại da','50ml',400000.00,760000.00,12,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(142,'Estée Lauder Pure Color Envy Lipstick',12,22,'Son thuần sắc cao cấp, dưỡng ẩm','N/A','3.5g',190000.00,370000.00,30,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(143,'Estée Lauder Advanced Night Repair Eye',12,16,'Kem mắt phục hồi ban đêm','Mọi loại da','15ml',320000.00,610000.00,15,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(144,'Estée Lauder Futurist Hydra Rescue SPF45',12,20,'Kem nền dưỡng ẩm phục hồi với SPF45','Da khô/thường','35ml',280000.00,540000.00,18,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(145,'Estée Lauder Beautiful Magnolia EDP',12,30,'Nước hoa nữ hương magnolia sang trọng','N/A','50ml',550000.00,1050000.00,58,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(146,'Estée Lauder Perfectly Clean Foam Cleanser',12,10,'Sữa rửa mặt tạo bọt nhẹ nhàng, 2 in 1','Mọi loại da','150ml',170000.00,329000.00,55,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(147,'Neutrogena Hydro Boost Water Gel',13,13,'Gel dưỡng ẩm với hyaluronic acid, không dầu','Da dầu/hỗn hợp','50ml',120000.00,229000.00,45,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(148,'Neutrogena Ultra Sheer Dry-Touch Sunscreen SPF50',13,14,'Kem chống nắng khô mịn không nhờn','Mọi loại da','88ml',100000.00,189000.00,54,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(149,'Neutrogena Deep Clean Facial Cleanser',13,10,'Sữa rửa mặt làm sạch sâu, loại bỏ bã nhờn','Da dầu','200ml',65000.00,125000.00,60,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(150,'Neutrogena Rapid Wrinkle Repair Serum',13,12,'Serum retinol giảm nếp nhăn nhanh chóng','Da lão hóa','29ml',150000.00,289000.00,25,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(151,'Neutrogena Hydro Boost Eye Cream',13,16,'Gel kem mắt dưỡng ẩm với hyaluronic acid','Mọi loại da','14g',110000.00,209000.00,38,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(152,'Neutrogena Rainbath Refreshing Shower Gel',13,50,'Sữa tắm hương thơm tươi mát cổ điển','Mọi loại da','250ml',80000.00,155000.00,45,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(153,'Neutrogena Norwegian Formula Hand Cream',13,51,'Kem dưỡng tay đậm đặc cho da khô nứt nẻ','Da khô','56g',50000.00,95000.00,55,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(154,'Neutrogena T/Gel Therapeutic Shampoo',13,40,'Dầu gội trị gàu và ngứa da đầu','N/A','250ml',90000.00,169000.00,35,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(155,'Nivea Creme',14,13,'Kem dưỡng ẩm đa năng huyền thoại','Mọi loại da','60ml',30000.00,59000.00,90,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(156,'Nivea Sun Protect & Moisture SPF50',14,14,'Kem chống nắng dưỡng ẩm SPF50','Mọi loại da','75ml',70000.00,135000.00,48,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(157,'Nivea Extra White Body Lotion',14,51,'Sữa dưỡng thể trắng da chứa vitamin C','Mọi loại da','200ml',55000.00,105000.00,63,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(158,'Nivea MicellAIR Skin Breathe Micellar Water',14,17,'Nước tẩy trang micellar cho da thở','Mọi loại da','200ml',55000.00,99000.00,70,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(159,'Nivea Men Deep Clean Face Wash',14,60,'Sữa rửa mặt nam giới làm sạch sâu','Da dầu','100ml',40000.00,79000.00,55,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(160,'Nivea Men Sensitive Moisturizer SPF15',14,61,'Kem dưỡng nam cho da nhạy cảm','Da nhạy cảm','75ml',55000.00,109000.00,45,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(161,'Nivea Deodorant Dry Comfort Roll-On',14,62,'Lăn khử mùi khô thoáng 48h','N/A','50ml',30000.00,59000.00,77,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(162,'Nivea Lip Care Original',14,22,'Son dưỡng môi giữ ẩm suốt ngày','N/A','4.8g',25000.00,49000.00,100,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(163,'Nivea Shower Cream Creme Soft',14,50,'Sữa tắm dưỡng ẩm mềm mịn với dầu hạnh nhân','Da khô/thường','250ml',40000.00,79000.00,60,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(164,'Nivea Body Scrub Raspberry & White Tea',14,52,'Tẩy tế bào chết toàn thân hương raspberry','Mọi loại da','200ml',45000.00,89000.00,45,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(165,'Dove Beauty Bar',15,50,'Xà phòng dưỡng ẩm 1/4 kem dưỡng','Mọi loại da','100g',18000.00,35000.00,96,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(166,'Dove Deeply Nourishing Body Wash',15,50,'Sữa tắm dưỡng ẩm sâu với NutriumMoisture','Da khô','250ml',45000.00,85000.00,68,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(167,'Dove Intensive Repair Shampoo',15,40,'Dầu gội phục hồi tóc hư tổn nặng','N/A','340ml',50000.00,95000.00,109,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(168,'Dove Hair Fall Rescue Conditioner',15,41,'Dầu xả ngăn rụng tóc với Trichazole Actives','N/A','340ml',50000.00,95000.00,55,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(169,'Dove DermaSpa Goodness Body Lotion',15,51,'Dưỡng thể cao cấp mềm mịn như lụa','Da khô','200ml',65000.00,125000.00,40,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(170,'Dove Essential Body Lotion Nourishing',15,51,'Sữa dưỡng thể dưỡng ẩm hằng ngày','Mọi loại da','250ml',50000.00,95000.00,89,NULL,1,'2026-03-28 01:19:46','2026-03-28 02:51:56'),(171,'Dove Men+Care Clean Comfort Body Wash',15,50,'Sữa tắm nam giới Clean Comfort','Mọi loại da','250ml',50000.00,95000.00,45,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46'),(172,'Dove Exfoliating Body Polish Pomegranate',15,52,'Tẩy tế bào chết toàn thân hương lựu','Mọi loại da','225ml',55000.00,105000.00,35,NULL,1,'2026-03-28 01:19:46','2026-03-28 01:19:46');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `rating` tinyint NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `is_visible` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  UNIQUE KEY `uq_customer_product` (`customer_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Đánh giá sản phẩm';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (7,72,1,3,'Sản phẩm rất tốt, da mình mịn hẳn sau 2 tuần sử dụng!',1,'2026-03-10 05:00:00'),(8,165,2,3,'Mùi hương dễ chịu, thấm nhanh, không nhớt.',1,'2026-03-11 05:00:00'),(9,161,3,3,'Đã mua lần 3 rồi, rất hài lòng.',1,'2026-03-12 05:00:00'),(10,128,4,3,'Giao hàng nhanh, đóng gói cẩn thận.',1,'2026-03-13 05:00:00'),(11,137,5,5,'Chất lượng tuyệt vời, xứng đáng với giá tiền.',1,'2026-03-14 05:00:00'),(12,58,6,5,'Sản phẩm okay, nhưng hơi đắt.',1,'2026-03-15 05:00:00'),(13,166,7,5,'Dùng rất phù hợp với da dầu, cảm ơn shop!',1,'2026-03-16 05:00:00'),(14,151,8,3,'Lần đầu thử, thấy khá ổn. Sẽ mua thêm.',1,'2026-03-17 05:00:00'),(15,109,1,4,'Da mình nhạy cảm nhưng dùng không bị kích ứng.',1,'2026-03-18 05:00:00'),(16,157,2,4,'Son lên màu chuẩn, giữ màu lâu, mua nữa!',1,'2026-03-19 05:00:00'),(17,89,3,4,'Kem chống nắng dùng rất thích, không trôi.',1,'2026-03-20 05:00:00'),(18,68,4,5,'Sản phẩm chính hãng, yên tâm dùng.',1,'2026-03-21 05:00:00');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `salaries`
--

DROP TABLE IF EXISTS `salaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salaries` (
  `salary_id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `month` tinyint NOT NULL,
  `year` year NOT NULL,
  `work_days_standard` int NOT NULL DEFAULT '22',
  `work_days_actual` int NOT NULL,
  `unpaid_leave_days` int NOT NULL DEFAULT '0',
  `base_salary` decimal(12,2) NOT NULL COMMENT 'Lương cơ bản tháng này',
  `gross_salary` decimal(12,2) NOT NULL COMMENT '= base * (actual/standard)',
  `bonus` decimal(12,2) NOT NULL DEFAULT '0.00',
  `deductions` decimal(12,2) NOT NULL DEFAULT '0.00',
  `net_salary` decimal(12,2) NOT NULL COMMENT '= gross + bonus - deductions',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `generated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `generated_by` int DEFAULT NULL,
  PRIMARY KEY (`salary_id`),
  UNIQUE KEY `uq_emp_month` (`employee_id`,`month`,`year`),
  KEY `generated_by` (`generated_by`),
  CONSTRAINT `salaries_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  CONSTRAINT `salaries_ibfk_2` FOREIGN KEY (`generated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `salaries_chk_1` CHECK ((`month` between 1 and 12))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lương tháng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `salaries`
--

LOCK TABLES `salaries` WRITE;
/*!40000 ALTER TABLE `salaries` DISABLE KEYS */;
INSERT INTO `salaries` VALUES (1,1,2,2026,22,22,0,15000000.00,15000000.00,2000000.00,0.00,17000000.00,'Thưởng doanh số tháng 2','2026-03-26 08:28:54',1),(2,2,2,2026,22,22,0,8000000.00,8000000.00,0.00,0.00,8000000.00,'','2026-03-26 08:28:54',1),(3,3,2,2026,22,21,0,8000000.00,7636364.00,0.00,0.00,7636364.00,'Nghỉ 1 ngày phép năm','2026-03-26 08:28:54',1),(4,4,2,2026,22,22,0,7500000.00,7500000.00,0.00,0.00,7500000.00,'','2026-03-26 08:28:54',1),(5,5,2,2026,22,20,1,8000000.00,7272727.00,0.00,0.00,7272727.00,'Nghỉ 2 ngày (1 phép + 1 không phép)','2026-03-26 08:28:54',1);
/*!40000 ALTER TABLE `salaries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `supplier_id` int NOT NULL AUTO_INCREMENT,
  `supplier_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`supplier_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Nhà cung cấp';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'Công ty TNHH Mỹ Phẩm Châu Âu','Anh Hoàng','0281234567','supply@chauau.vn','10 Đinh Tiên Hoàng, Q1, TP.HCM',1,'2026-03-26 08:28:54'),(2,'Phân phối Mỹ Phẩm Hàn Quốc K-Beauty','Chị Linh','0282345678','kbeauty@kpham.vn','25 Lý Tự Trọng, Q1, TP.HCM',1,'2026-03-26 08:28:54'),(3,'Beauty World Distribution','Mr. Minh','0283456789','bwd@beautyworld.vn','50 Nguyễn Đình Chiểu, Q3, TP.HCM',1,'2026-03-26 08:28:54');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','manager','staff','warehouse') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'staff',
  `employee_id` int DEFAULT NULL COMMENT 'NULL = tài khoản hệ thống không gắn NV',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tài khoản đăng nhập hệ thống';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2a$10$F6Ji.Ob7lgNeTH5nNu1z6u5kHTe2ZFC8y07fBJ6Vkp8kIEqQaBMCe','admin',NULL,1,'2026-03-28 06:04:23','2026-03-26 08:28:54'),(2,'manager01','$2a$10$Aq2ZCO6ku/woW.6kHDtKT.OHWdnEJ3yE6Wnq02h/k/N.ZIC7Dp3am','manager',1,1,NULL,'2026-03-26 08:28:54'),(3,'staff01','$2a$10$81gfeSV6MHqytqOpCwCUIOujZfOlkvsHC/WGAxxbVwBxFl7JrGY4K','staff',2,1,NULL,'2026-03-26 08:28:54'),(4,'staff02','$2a$10$G4oa.cKceKYSRGTdAv5IcuEaIR0eyR9su8jPGxzMI4v3UAvh6fSOm','staff',3,1,NULL,'2026-03-26 08:28:54'),(5,'warehouse01','$2a$10$PCwQZF7wJV7xLXVfnsh4gOsgZwjpstKMXMR9s/575eh0.mLQssKqe','warehouse',4,1,NULL,'2026-03-26 08:28:54'),(6,'staff03','$2a$10$bAJZczf54gHfdAF9cvRxFudNMz2blwL5cqdXHJ7eN2tqlxcJ5.Aiu','staff',5,1,NULL,'2026-03-26 08:28:54');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'julie_cosmetics'
--
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-29 12:19:17
