import {
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { Repository } from 'typeorm';
import { EditTaskDto } from './dtos/edit-task.dto';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);
    constructor(
        @InjectRepository(Task)
        private readonly tasksRepository: Repository<Task>,
    ) {}

    async listTasks(userId: string) {
        try {
            const tasks = await this.tasksRepository.find({
                where: { owner: { id: userId } },
            });

            this.logger.log(
                `Listed tasks for user ${userId}: ${tasks.length} tasks`,
            );
            return tasks;
        } catch (error) {
            this.logger.error(
                `Failed to list tasks for user ${userId}: ${error.message}`,
            );
            throw new InternalServerErrorException('Failed to retrieve tasks');
        }
    }

    async getTask(id: string, userId: string) {
        try {
            const task = await this.tasksRepository.findOne({
                where: { id, owner: { id: userId } },
            });

            if (!task) {
                this.logger.warn(
                    `User ${userId} tried to access task ${id} without permission`,
                );
                throw new ForbiddenException(
                    'You do not have access to this task.',
                );
            }

            this.logger.log(`Task ${id} retrieved for user ${userId}`);
            return task;
        } catch (error) {
            if (error instanceof ForbiddenException) {
                throw error;
            }
            this.logger.error(
                `Error retrieving task ${id} for user ${userId}: ${error.message}`,
            );
            throw new InternalServerErrorException('Could not retrieve task');
        }
    }

    async editTask(id: string, dto: EditTaskDto, userId: string) {
        try {
            const task = await this.getTask(id, userId);
            const updatedTask = Object.assign(task, dto);
            const result = await this.tasksRepository.save(updatedTask);

            this.logger.log(`Task ${id} edited by user ${userId}`);
            return result;
        } catch (error) {
            if (error instanceof ForbiddenException) {
                throw error;
            }
            this.logger.error(
                `Error editing task ${id} by user ${userId}: ${error.message}`,
            );
            throw new InternalServerErrorException('Error editing the task');
        }
    }
}
