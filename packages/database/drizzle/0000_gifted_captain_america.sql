CREATE TABLE `products` (
	`id` varchar(36) NOT NULL,
	`product_code` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`uom` varchar(100) NOT NULL,
	`category` varchar(150) NOT NULL,
	`sub_category` varchar(150) NOT NULL,
	`status` enum('Active','Inactive','Discontinued') NOT NULL DEFAULT 'Active',
	`price` double,
	`stock` int,
	`image_url` text NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_product_code_unique` UNIQUE(`product_code`)
);
--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category`);--> statement-breakpoint
CREATE INDEX `products_status_idx` ON `products` (`status`);