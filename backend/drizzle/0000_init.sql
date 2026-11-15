CREATE TABLE `trips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`title` varchar(80) NOT NULL,
	`cover` varchar(16) NOT NULL DEFAULT 'city',
	`is_public` boolean NOT NULL DEFAULT false,
	`featured` boolean NOT NULL DEFAULT false,
	`author_name` varchar(40),
	`from_name` varchar(120) NOT NULL,
	`from_code` varchar(5) NOT NULL,
	`to_name` varchar(120) NOT NULL,
	`to_code` varchar(5) NOT NULL,
	`stop_count` int NOT NULL DEFAULT 0,
	`distance_km` int,
	`start_date` date,
	`end_date` date,
	`plan` longtext NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `trips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(254) NOT NULL,
	`username` varchar(40) NOT NULL,
	`google_sub` varchar(64) NOT NULL,
	`token_version` int NOT NULL DEFAULT 0,
	`locale` varchar(5) NOT NULL DEFAULT 'fr',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_google_sub_unique` UNIQUE(`google_sub`)
);
--> statement-breakpoint
ALTER TABLE `trips` ADD CONSTRAINT `trips_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `trips_public_created_idx` ON `trips` (`is_public`,`created_at`);--> statement-breakpoint
CREATE INDEX `trips_user_idx` ON `trips` (`user_id`);--> statement-breakpoint
CREATE INDEX `trips_from_code_idx` ON `trips` (`from_code`);