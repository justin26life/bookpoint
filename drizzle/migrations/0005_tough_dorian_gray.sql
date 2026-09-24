CREATE TABLE `memes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`caption` text NOT NULL,
	`image` text NOT NULL,
	`sound_url` text,
	`category` text
);
--> statement-breakpoint
DROP TABLE `books`;