import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
    let service: AuthService;
    let usersService: UsersService;
    let jwtService: JwtService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UsersService,
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        signAsync: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        usersService = module.get<UsersService>(UsersService);
        jwtService = module.get<JwtService>(JwtService);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
        jest.spyOn(usersService, 'findOne').mockRejectedValue(
            new UnauthorizedException('Invalid email or password'),
        );

        await expect(
            service.signIn({ email: 'test@example.com', pass: 'password' }),
        ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
        const user = {
            id: '1',
            email: 'test@example.com',
            pass: await bcrypt.hash('correct_password', 10),
            fullname: 'Test User',
            tasks: [],
        };

        jest.spyOn(usersService, 'findOne').mockResolvedValue(user);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(
            service.signIn({
                email: 'test@example.com',
                pass: 'wrong_password',
            }),
        ).rejects.toThrow(UnauthorizedException);
    });

    it('should return access token if credentials are valid', async () => {
        const user = {
            id: '1',
            email: 'test@example.com',
            pass: await bcrypt.hash('password', 10),
            fullname: 'Test User',
            tasks: [],
        };
        const token = 'mockToken';

        jest.spyOn(usersService, 'findOne').mockResolvedValue(user);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        jest.spyOn(jwtService, 'signAsync').mockResolvedValue(token);

        const result = await service.signIn({
            email: 'test@example.com',
            pass: 'password',
        });

        expect(result).toEqual({ access_token: token });
    });
});
