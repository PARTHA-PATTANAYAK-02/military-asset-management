-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: localhost    Database: military_asset_db
-- ------------------------------------------------------
-- Server version	8.0.34

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `assignments`
--

DROP TABLE IF EXISTS `assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `base_id` int NOT NULL,
  `equipment_type_id` int NOT NULL,
  `personnel_name` varchar(150) NOT NULL,
  `quantity` int NOT NULL,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('ACTIVE','RETURNED') NOT NULL DEFAULT 'ACTIVE',
  `created_by` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `base_id` (`base_id`),
  KEY `equipment_type_id` (`equipment_type_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `assignments_ibfk_1` FOREIGN KEY (`base_id`) REFERENCES `bases` (`id`),
  CONSTRAINT `assignments_ibfk_2` FOREIGN KEY (`equipment_type_id`) REFERENCES `equipment_types` (`id`),
  CONSTRAINT `assignments_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `assignments_chk_1` CHECK ((`quantity` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignments`
--

LOCK TABLES `assignments` WRITE;
/*!40000 ALTER TABLE `assignments` DISABLE KEYS */;
INSERT INTO `assignments` VALUES (1,1,1,'Demo Personnel',2,'2026-10-13 04:33:31','RETURNED',1),(2,1,1,'none',1,'2026-10-13 04:45:04','RETURNED',1);
/*!40000 ALTER TABLE `assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(100) NOT NULL,
  `entity_id` int DEFAULT NULL,
  `details` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,'PURCHASE_CREATED','purchase',1,'{\"baseId\": 1, \"quantity\": 5, \"purchaseDate\": \"2026-10-13\", \"equipmentTypeId\": 1}','2026-10-13 04:13:27'),(2,1,'PURCHASE_CREATED','purchase',2,'{\"baseId\": 1, \"quantity\": 1, \"purchaseDate\": \"2026-10-13\", \"equipmentTypeId\": 1}','2026-10-13 04:20:18'),(3,1,'TRANSFER_CREATED','transfer',1,'{\"quantity\": 3, \"toBaseId\": 2, \"fromBaseId\": 1, \"transferDate\": \"2026-10-13\", \"equipmentTypeId\": 1}','2026-10-13 04:23:48'),(4,1,'TRANSFER_CREATED','transfer',2,'{\"quantity\": 1, \"toBaseId\": 2, \"fromBaseId\": 1, \"transferDate\": \"2026-10-13\", \"equipmentTypeId\": 1}','2026-10-13 04:27:27'),(5,1,'ASSIGNMENT_CREATED','assignment',1,'{\"baseId\": 1, \"quantity\": 2, \"personnelName\": \"Demo Personnel\", \"equipmentTypeId\": 1}','2026-10-13 04:33:31'),(6,1,'ASSIGNMENT_RETURNED','assignment',1,'{\"quantity\": 2}','2026-10-13 04:35:45'),(7,1,'EXPENDITURE_CREATED','expenditure',1,'{\"baseId\": 1, \"reason\": \"Demo expenditure for testing\", \"quantity\": 1, \"equipmentTypeId\": 1, \"expenditureDate\": \"2026-10-13\"}','2026-10-13 04:36:20'),(8,1,'ASSIGNMENT_CREATED','assignment',2,'{\"baseId\": 1, \"quantity\": 1, \"personnelName\": \"none\", \"equipmentTypeId\": 1}','2026-10-13 04:45:04'),(9,1,'ASSIGNMENT_RETURNED','assignment',2,'{\"quantity\": 1}','2026-10-13 04:45:10'),(10,1,'EXPENDITURE_CREATED','expenditure',2,'{\"baseId\": 1, \"reason\": \"none\", \"quantity\": 1, \"equipmentTypeId\": 1, \"expenditureDate\": \"2026-10-13\"}','2026-10-13 04:45:19');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bases`
--

DROP TABLE IF EXISTS `bases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bases`
--

LOCK TABLES `bases` WRITE;
/*!40000 ALTER TABLE `bases` DISABLE KEYS */;
INSERT INTO `bases` VALUES (1,'Alpha Base','North Zone','2026-10-13 03:55:18'),(2,'Bravo Base','South Zone','2026-10-13 03:55:18'),(3,'Charlie Base','East Zone','2026-10-13 03:55:18');
/*!40000 ALTER TABLE `bases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipment_types`
--

DROP TABLE IF EXISTS `equipment_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL,
  `unit` varchar(30) NOT NULL DEFAULT 'units',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipment_types`
--

LOCK TABLES `equipment_types` WRITE;
/*!40000 ALTER TABLE `equipment_types` DISABLE KEYS */;
INSERT INTO `equipment_types` VALUES (1,'Utility Vehicle','Vehicle','units'),(2,'Radio Set','Communication','units'),(3,'Medical Kit','Medical','kits'),(4,'Fuel Container','Supply','units');
/*!40000 ALTER TABLE `equipment_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenditures`
--

DROP TABLE IF EXISTS `expenditures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenditures` (
  `id` int NOT NULL AUTO_INCREMENT,
  `base_id` int NOT NULL,
  `equipment_type_id` int NOT NULL,
  `quantity` int NOT NULL,
  `expenditure_date` date NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `base_id` (`base_id`),
  KEY `equipment_type_id` (`equipment_type_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `expenditures_ibfk_1` FOREIGN KEY (`base_id`) REFERENCES `bases` (`id`),
  CONSTRAINT `expenditures_ibfk_2` FOREIGN KEY (`equipment_type_id`) REFERENCES `equipment_types` (`id`),
  CONSTRAINT `expenditures_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `expenditures_chk_1` CHECK ((`quantity` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenditures`
--

LOCK TABLES `expenditures` WRITE;
/*!40000 ALTER TABLE `expenditures` DISABLE KEYS */;
INSERT INTO `expenditures` VALUES (1,1,1,1,'2026-10-13','Demo expenditure for testing',1,'2026-10-13 04:36:20'),(2,1,1,1,'2026-10-13','none',1,'2026-10-13 04:45:19');
/*!40000 ALTER TABLE `expenditures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `opening_balances`
--

DROP TABLE IF EXISTS `opening_balances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `opening_balances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `base_id` int NOT NULL,
  `equipment_type_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `base_id` (`base_id`,`equipment_type_id`),
  KEY `equipment_type_id` (`equipment_type_id`),
  CONSTRAINT `opening_balances_ibfk_1` FOREIGN KEY (`base_id`) REFERENCES `bases` (`id`),
  CONSTRAINT `opening_balances_ibfk_2` FOREIGN KEY (`equipment_type_id`) REFERENCES `equipment_types` (`id`),
  CONSTRAINT `opening_balances_chk_1` CHECK ((`quantity` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opening_balances`
--

LOCK TABLES `opening_balances` WRITE;
/*!40000 ALTER TABLE `opening_balances` DISABLE KEYS */;
INSERT INTO `opening_balances` VALUES (1,1,1,20),(2,1,2,50),(3,1,3,30),(4,1,4,40),(5,2,1,15),(6,2,2,35),(7,2,3,25),(8,2,4,30),(9,3,1,10),(10,3,2,25),(11,3,3,20),(12,3,4,20);
/*!40000 ALTER TABLE `opening_balances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchases`
--

DROP TABLE IF EXISTS `purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `base_id` int NOT NULL,
  `equipment_type_id` int NOT NULL,
  `quantity` int NOT NULL,
  `purchase_date` date NOT NULL,
  `notes` text,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `base_id` (`base_id`),
  KEY `equipment_type_id` (`equipment_type_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `purchases_ibfk_1` FOREIGN KEY (`base_id`) REFERENCES `bases` (`id`),
  CONSTRAINT `purchases_ibfk_2` FOREIGN KEY (`equipment_type_id`) REFERENCES `equipment_types` (`id`),
  CONSTRAINT `purchases_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `purchases_chk_1` CHECK ((`quantity` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchases`
--

LOCK TABLES `purchases` WRITE;
/*!40000 ALTER TABLE `purchases` DISABLE KEYS */;
INSERT INTO `purchases` VALUES (1,1,1,5,'2026-10-13','Demo purchase record',1,'2026-10-13 04:13:27'),(2,1,1,1,'2026-10-13',NULL,1,'2026-10-13 04:20:18');
/*!40000 ALTER TABLE `purchases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transfers`
--

DROP TABLE IF EXISTS `transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transfers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `from_base_id` int NOT NULL,
  `to_base_id` int NOT NULL,
  `equipment_type_id` int NOT NULL,
  `quantity` int NOT NULL,
  `transfer_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('COMPLETED','CANCELLED') NOT NULL DEFAULT 'COMPLETED',
  `notes` text,
  `created_by` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `from_base_id` (`from_base_id`),
  KEY `to_base_id` (`to_base_id`),
  KEY `equipment_type_id` (`equipment_type_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `transfers_ibfk_1` FOREIGN KEY (`from_base_id`) REFERENCES `bases` (`id`),
  CONSTRAINT `transfers_ibfk_2` FOREIGN KEY (`to_base_id`) REFERENCES `bases` (`id`),
  CONSTRAINT `transfers_ibfk_3` FOREIGN KEY (`equipment_type_id`) REFERENCES `equipment_types` (`id`),
  CONSTRAINT `transfers_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `transfers_chk_1` CHECK ((`quantity` > 0)),
  CONSTRAINT `transfers_chk_2` CHECK ((`from_base_id` <> `to_base_id`))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transfers`
--

LOCK TABLES `transfers` WRITE;
/*!40000 ALTER TABLE `transfers` DISABLE KEYS */;
INSERT INTO `transfers` VALUES (1,1,2,1,3,'2026-10-12 18:30:00','COMPLETED','Demo transfer',1),(2,1,2,1,1,'2026-10-12 18:30:00','COMPLETED',NULL,1);
/*!40000 ALTER TABLE `transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('ADMIN','BASE_COMMANDER','LOGISTICS_OFFICER') NOT NULL,
  `base_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `base_id` (`base_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`base_id`) REFERENCES `bases` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'System Administrator','admin.email@gmail.com','$2b$12$LA3A5gPy.OkToUiVOP7PGupmck//UFv0o2cYpamt76iRB7x7p0P1G','ADMIN',NULL,'2026-10-13 03:50:09'),(2,'Alpha Base Commander','commander.alpha@test.local','$2b$12$qoWVfepTVF5HK0aqVJRvVeHVCjvk3MKCO57iyeD2sb.L31OPmiyqu','BASE_COMMANDER',1,'2026-10-13 04:53:36'),(3,'Bravo Logistics Officer','logistics.bravo@test.local','$2b$12$NDXaaJbsd6TcCPvdirZqO.HBzV/HaXZCV4UZHuNwRbtJ9Ot9te.yW','LOGISTICS_OFFICER',2,'2026-10-13 04:53:37');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-13 11:26:42
