import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { Repository } from 'typeorm';
import {
    ForbiddenException,
    InternalServerErrorException,
} from '@nestjs/common';
import { EditTaskDto } from './dtos/edit-task.dto';
import { User } from 'src/entities/user.entity';

describe('TasksService', () => {
    let service: TasksService;
    let tasksRepository: jest.Mocked<Partial<Repository<Task>>>;

    const userId = 'user-123';
    const mockUser: User = { id: userId } as User;
    const mockTask: Task = {
        id: 'task-1',
        title: 'Sample task',
        description: 'A task',
        done: false,
        dueDate: '2025-12-31T00:00:00.000Z',
        owner: mockUser,
    };

    beforeEach(async () => {
        tasksRepository = {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TasksService,
                {
                    provide: getRepositoryToken(Task),
                    useValue: tasksRepository,
                },
            ],
        }).compile();

        service = module.get<TasksService>(TasksService);
    });

    describe('listTasks', () => {
        it('should return an array of tasks for the given user', async () => {
            tasksRepository.find!.mockResolvedValue([mockTask]);

            const result = await service.listTasks(userId);

            expect(result).toEqual([mockTask]);
            expect(tasksRepository.find).toHaveBeenCalledWith({
                where: { owner: { id: userId } },
            });
        });

        it('should return an empty array if no tasks are found', async () => {
            tasksRepository.find!.mockResolvedValue([]);

            const result = await service.listTasks(userId);

            expect(result).toEqual([]);
        });

        it('should throw InternalServerErrorException on error', async () => {
            tasksRepository.find!.mockRejectedValue(new Error('DB error'));

            await expect(service.listTasks(userId)).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('getTask', () => {
        it('should return the task if it belongs to the user', async () => {
            tasksRepository.findOne!.mockResolvedValue(mockTask);

            const result = await service.getTask(mockTask.id, userId);

            expect(result).toEqual(mockTask);
            expect(tasksRepository.findOne).toHaveBeenCalledWith({
                where: { id: mockTask.id, owner: { id: userId } },
            });
        });

        it('should throw ForbiddenException if task is not found', async () => {
            tasksRepository.findOne!.mockResolvedValue(undefined);

            await expect(
                service.getTask('non-existent-task', userId),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw InternalServerErrorException on error', async () => {
            tasksRepository.findOne!.mockRejectedValue(
                new Error('Query failed'),
            );

            await expect(service.getTask(mockTask.id, userId)).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('editTask', () => {
        const dto: EditTaskDto = {
            title: 'Updated title',
            done: true,
        };

        it('should update and return the task if user is the owner', async () => {
            const updatedTask = { ...mockTask, ...dto };
            jest.spyOn(service, 'getTask').mockResolvedValue(mockTask);
            tasksRepository.save!.mockResolvedValue(updatedTask);

            const result = await service.editTask(mockTask.id, dto, userId);

            expect(result).toEqual(updatedTask);
            expect(tasksRepository.save).toHaveBeenCalledWith({
                ...mockTask,
                ...dto,
            });
        });

        it('should throw ForbiddenException if user has no access', async () => {
            jest.spyOn(service, 'getTask').mockRejectedValue(
                new ForbiddenException(),
            );

            await expect(
                service.editTask(mockTask.id, dto, userId),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw InternalServerErrorException on save error', async () => {
            jest.spyOn(service, 'getTask').mockResolvedValue(mockTask);
            tasksRepository.save!.mockRejectedValue(new Error('Save failed'));

            await expect(
                service.editTask(mockTask.id, dto, userId),
            ).rejects.toThrow(InternalServerErrorException);
        });
    });
});
