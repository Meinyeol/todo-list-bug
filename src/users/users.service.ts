import {
    ConflictException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dtos/create-user.dto';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}
    async create(body: CreateUserDto): Promise<Omit<User, 'pass'>> {
        try {
            const existing = await this.usersRepository.findOneBy({
                email: body.email,
            });

            if (existing) {
                this.logger.warn(
                    `Attempt to create user with existing email: ${body.email}`,
                );
                throw new ConflictException('Email is already in use');
            }

            const user = new User();
            user.email = body.email;
            user.fullname = body.fullname;

            const saltRounds = 10;
            user.pass = await bcrypt.hash(body.password, saltRounds);

            await this.usersRepository.save(user);
            const savedUser = await this.usersRepository.save(user);
            const { pass, ...safeUser } = savedUser;
            this.logger.log(`User created successfully: ${user.email}`);
            return safeUser;
        } catch (error) {
            this.logger.error(
                `Error creating user with email ${body.email}`,
                error.stack,
            );
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new InternalServerErrorException('Error creating user');
        }
    }

    async findOne(email: string): Promise<User> {
        try {
            const user = await this.usersRepository.findOneBy({ email });

            if (!user) {
                this.logger.warn(`User with email ${email} not found`);
                throw new NotFoundException('User not found');
            }

            this.logger.log(`User found: ${email}`);
            return user;
        } catch (error) {
            this.logger.error(
                `Error retrieving user with email ${email}`,
                error.stack,
            );
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Error retrieving user');
        }
    }
}
