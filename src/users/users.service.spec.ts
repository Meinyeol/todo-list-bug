import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
jest.mock('bcrypt', () => ({
    hash: jest.fn(),
}));
import * as bcrypt from 'bcrypt';
import {
    ConflictException,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';

describe('UsersService', () => {
    let service: UsersService;
    let usersRepository: jest.Mocked<Partial<Repository<User>>>;

    const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        fullname: 'Test User',
        password: 'securepassword',
    };

    const mockUser: User = {
        email: createUserDto.email,
        fullname: createUserDto.fullname,
        pass: 'hashedpass',
    } as User;

    beforeEach(async () => {
        usersRepository = {
            findOneBy: jest.fn(),
            save: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: usersRepository,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    describe('create', () => {
        it('should create and return user without password if email is not in use', async () => {
            usersRepository.findOneBy!.mockResolvedValue(null);
            usersRepository.save!.mockImplementation(
                async (user) =>
                    ({
                        ...user,
                        id: 'user-id',
                    }) as User,
            );

            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpass');

            const result = await service.create(createUserDto);

            expect(result).toEqual({
                id: 'user-id',
                email: createUserDto.email,
                fullname: createUserDto.fullname,
            });

            expect(usersRepository.findOneBy).toHaveBeenCalledWith({
                email: createUserDto.email,
            });

            expect(usersRepository.save).toHaveBeenCalled();
        });

        it('should throw ConflictException if email is already used', async () => {
            usersRepository.findOneBy!.mockResolvedValue(mockUser);

            await expect(service.create(createUserDto)).rejects.toThrow(
                ConflictException,
            );
        });

        it('should throw InternalServerErrorException on other errors', async () => {
            usersRepository.findOneBy!.mockRejectedValue(
                new Error('DB failed'),
            );

            await expect(service.create(createUserDto)).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('findOne', () => {
        it('should return user by email if exists', async () => {
            usersRepository.findOneBy!.mockResolvedValue(mockUser);

            const result = await service.findOne(createUserDto.email);

            expect(result).toEqual(mockUser);
            expect(usersRepository.findOneBy).toHaveBeenCalledWith({
                email: createUserDto.email,
            });
        });

        it('should throw NotFoundException if user not found', async () => {
            usersRepository.findOneBy!.mockResolvedValue(undefined);

            await expect(service.findOne(createUserDto.email)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw InternalServerErrorException on error', async () => {
            usersRepository.findOneBy!.mockRejectedValue(
                new Error('Query failed'),
            );

            await expect(service.findOne(createUserDto.email)).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });
});
