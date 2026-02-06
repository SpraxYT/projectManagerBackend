-- CreateTable
CREATE TABLE `settings` (
    `id` VARCHAR(191) NOT NULL,
    `instance_name` VARCHAR(191) NOT NULL DEFAULT 'ProjectManager',
    `enable_registration` BOOLEAN NOT NULL DEFAULT true,
    `enable_google_auth` BOOLEAN NOT NULL DEFAULT false,
    `maintenance_mode` BOOLEAN NOT NULL DEFAULT false,
    `maintenance_message` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
