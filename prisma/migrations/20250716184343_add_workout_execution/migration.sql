-- CreateTable
CREATE TABLE `workout_executions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `dayOfWeek` VARCHAR(191) NOT NULL,
    `muscleGroups` JSON NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NULL,
    `status` ENUM('IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `workout_executions_userId_date_key`(`userId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exercise_executions` (
    `id` VARCHAR(191) NOT NULL,
    `workoutExecutionId` VARCHAR(191) NOT NULL,
    `exerciseId` VARCHAR(191) NOT NULL,
    `exerciseName` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `plannedSeries` INTEGER NOT NULL,
    `completedSeries` INTEGER NOT NULL DEFAULT 0,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `series_executions` (
    `id` VARCHAR(191) NOT NULL,
    `exerciseExecutionId` VARCHAR(191) NOT NULL,
    `seriesNumber` INTEGER NOT NULL,
    `weight` DECIMAL(6, 2) NOT NULL,
    `reps` INTEGER NOT NULL,
    `restTime` INTEGER NULL,
    `difficulty` INTEGER NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `series_executions_exerciseExecutionId_seriesNumber_key`(`exerciseExecutionId`, `seriesNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `workout_executions` ADD CONSTRAINT `workout_executions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exercise_executions` ADD CONSTRAINT `exercise_executions_workoutExecutionId_fkey` FOREIGN KEY (`workoutExecutionId`) REFERENCES `workout_executions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exercise_executions` ADD CONSTRAINT `exercise_executions_exerciseId_fkey` FOREIGN KEY (`exerciseId`) REFERENCES `exercises`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `series_executions` ADD CONSTRAINT `series_executions_exerciseExecutionId_fkey` FOREIGN KEY (`exerciseExecutionId`) REFERENCES `exercise_executions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
