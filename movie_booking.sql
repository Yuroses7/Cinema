-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 31, 2025 at 06:12 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `movie_booking`
--

-- --------------------------------------------------------

--
-- Stand-in structure for view `admin_bookings_view`
-- (See below for the actual view)
--
CREATE TABLE `admin_bookings_view` (
`booking_id` int(11)
,`customer_name` varchar(100)
,`customer_email` varchar(255)
,`seat_numbers` text
,`total_price` decimal(10,2)
,`ticket_image_path` varchar(500)
,`created_at` datetime
,`movie_title` varchar(255)
,`showtime` time
);

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `showtime_id` int(11) DEFAULT NULL,
  `customer_name` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `customer_email` varchar(255) DEFAULT NULL,
  `ticket_image_path` varchar(500) DEFAULT NULL,
  `seat_numbers` text DEFAULT NULL,
  `total_price` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `showtime_id`, `customer_name`, `created_at`, `customer_email`, `ticket_image_path`, `seat_numbers`, `total_price`) VALUES
(1, 1, 'นาย ทดสอบ', '2025-07-27 21:37:12', 'test@example.com', NULL, NULL, NULL),
(2, 1, 'Yuro sud lhor', '2025-07-27 21:42:26', 'test@example.com', NULL, NULL, NULL),
(3, 1, 'Yuro  lhor mak', '2025-07-28 20:46:06', 'test@example.com', NULL, NULL, NULL),
(4, 3, 'ยูโร', '2025-07-28 23:01:12', 'chayanan@gmail.com', NULL, NULL, NULL),
(5, 1, 'ยูโร', '2025-07-28 23:22:23', 'chayanan.ru@ku.th', NULL, NULL, NULL),
(6, 4, 's', '2025-07-29 20:54:39', 's', NULL, NULL, NULL),
(7, 4, 'ss', '2025-07-29 21:10:37', 'ss', NULL, NULL, NULL),
(8, 4, 'โร', '2025-07-29 21:12:11', 'chayananan', NULL, NULL, NULL),
(9, 3, 'มาท', '2025-07-29 21:13:28', 'chya', NULL, NULL, NULL),
(10, 3, 'มาททท', '2025-07-29 21:22:15', 'กกก', NULL, NULL, NULL),
(11, 6, 'มาทครับ', '2025-07-29 21:36:00', 'mart', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `booking_details`
--

CREATE TABLE `booking_details` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `seat_number` varchar(10) DEFAULT NULL,
  `seat_id` int(11) DEFAULT NULL,
  `showtime_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `booking_details`
--

INSERT INTO `booking_details` (`id`, `booking_id`, `seat_number`, `seat_id`, `showtime_id`) VALUES
(1, 1, NULL, 1, 1),
(2, 1, NULL, 2, 1),
(3, 1, NULL, 3, 1),
(4, 2, NULL, 4, 1),
(5, 2, NULL, 5, 1),
(6, 2, NULL, 6, 1),
(7, 3, NULL, 8, 1),
(8, 4, NULL, 1, 3),
(9, 5, NULL, 7, 1),
(10, 6, NULL, 6, 4),
(11, 7, NULL, 4, 4),
(12, 8, NULL, 3, 4),
(13, 9, NULL, 2, 3),
(14, 10, NULL, 7, 3),
(15, 11, NULL, 36, 6);

-- --------------------------------------------------------

--
-- Table structure for table `movies`
--

CREATE TABLE `movies` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `poster_url` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `movies`
--

INSERT INTO `movies` (`id`, `title`, `description`, `poster_url`) VALUES
(1, 'Avengers: Endgame', 'มหากาพย์การต่อสู้เพื่อกู้จักรวาล', 'https://image.tmdb.org/t/p/w500/q6725aR8Zs4IwGMXzZT8aC8lh41.jpg'),
(2, 'The Dark Knight', 'แบทแมนเผชิญโจ๊กเกอร์สุดอันตราย', 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg'),
(3, 'Inception', 'เข้าไปในฝันเพื่อดึงข้อมูล', 'https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `seats`
--

CREATE TABLE `seats` (
  `id` int(11) NOT NULL,
  `row_letter` varchar(5) NOT NULL,
  `seat_number` int(11) NOT NULL,
  `seat_type` enum('regular','premium','vip') DEFAULT 'regular',
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `seats`
--

INSERT INTO `seats` (`id`, `row_letter`, `seat_number`, `seat_type`, `price`) VALUES
(1, 'A', 1, 'vip', 350.00),
(2, 'A', 2, 'vip', 350.00),
(3, 'A', 3, 'vip', 350.00),
(4, 'A', 4, 'vip', 350.00),
(5, 'A', 5, 'vip', 350.00),
(6, 'A', 6, 'vip', 350.00),
(7, 'A', 7, 'vip', 350.00),
(8, 'A', 8, 'vip', 350.00),
(9, 'B', 1, 'premium', 280.00),
(10, 'B', 2, 'premium', 280.00),
(11, 'B', 3, 'premium', 280.00),
(12, 'B', 4, 'premium', 280.00),
(13, 'B', 5, 'premium', 280.00),
(14, 'B', 6, 'premium', 280.00),
(15, 'B', 7, 'premium', 280.00),
(16, 'B', 8, 'premium', 280.00),
(17, 'C', 1, 'premium', 280.00),
(18, 'C', 2, 'premium', 280.00),
(19, 'C', 3, 'premium', 280.00),
(20, 'C', 4, 'premium', 280.00),
(21, 'C', 5, 'premium', 280.00),
(22, 'C', 6, 'premium', 280.00),
(23, 'C', 7, 'premium', 280.00),
(24, 'C', 8, 'premium', 280.00),
(25, 'D', 1, 'regular', 220.00),
(26, 'D', 2, 'regular', 220.00),
(27, 'D', 3, 'regular', 220.00),
(28, 'D', 4, 'regular', 220.00),
(29, 'D', 5, 'regular', 220.00),
(30, 'D', 6, 'regular', 220.00),
(31, 'D', 7, 'regular', 220.00),
(32, 'D', 8, 'regular', 220.00),
(33, 'E', 1, 'regular', 220.00),
(34, 'E', 2, 'regular', 220.00),
(35, 'E', 3, 'regular', 220.00),
(36, 'E', 4, 'regular', 220.00),
(37, 'E', 5, 'regular', 220.00),
(38, 'E', 6, 'regular', 220.00),
(39, 'E', 7, 'regular', 220.00),
(40, 'E', 8, 'regular', 220.00);

-- --------------------------------------------------------

--
-- Table structure for table `showtimes`
--

CREATE TABLE `showtimes` (
  `id` int(11) NOT NULL,
  `movie_id` int(11) DEFAULT NULL,
  `time` time DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `showtimes`
--

INSERT INTO `showtimes` (`id`, `movie_id`, `time`) VALUES
(1, 1, '12:00:00'),
(2, 1, '15:00:00'),
(3, 2, '13:00:00'),
(4, 2, '16:00:00'),
(5, 3, '10:00:00'),
(6, 3, '18:00:00');

-- --------------------------------------------------------

--
-- Structure for view `admin_bookings_view`
--
DROP TABLE IF EXISTS `admin_bookings_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `admin_bookings_view`  AS SELECT `b`.`id` AS `booking_id`, `b`.`customer_name` AS `customer_name`, `b`.`customer_email` AS `customer_email`, `b`.`seat_numbers` AS `seat_numbers`, `b`.`total_price` AS `total_price`, `b`.`ticket_image_path` AS `ticket_image_path`, `b`.`created_at` AS `created_at`, `m`.`title` AS `movie_title`, `s`.`time` AS `showtime` FROM ((`bookings` `b` left join `showtimes` `s` on(`b`.`showtime_id` = `s`.`id`)) left join `movies` `m` on(`s`.`movie_id` = `m`.`id`)) ORDER BY `b`.`created_at` DESC ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `showtime_id` (`showtime_id`);

--
-- Indexes for table `booking_details`
--
ALTER TABLE `booking_details`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_booking_seat` (`showtime_id`,`seat_id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `booking_details_seat_fk` (`seat_id`);

--
-- Indexes for table `movies`
--
ALTER TABLE `movies`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `seats`
--
ALTER TABLE `seats`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_seat` (`row_letter`,`seat_number`);

--
-- Indexes for table `showtimes`
--
ALTER TABLE `showtimes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `movie_id` (`movie_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `booking_details`
--
ALTER TABLE `booking_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `movies`
--
ALTER TABLE `movies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `seats`
--
ALTER TABLE `seats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `showtimes`
--
ALTER TABLE `showtimes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`showtime_id`) REFERENCES `showtimes` (`id`);

--
-- Constraints for table `booking_details`
--
ALTER TABLE `booking_details`
  ADD CONSTRAINT `booking_details_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  ADD CONSTRAINT `booking_details_seat_fk` FOREIGN KEY (`seat_id`) REFERENCES `seats` (`id`),
  ADD CONSTRAINT `booking_details_showtime_fk` FOREIGN KEY (`showtime_id`) REFERENCES `showtimes` (`id`);

--
-- Constraints for table `showtimes`
--
ALTER TABLE `showtimes`
  ADD CONSTRAINT `showtimes_ibfk_1` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
