import {
    Injectable,
    InternalServerErrorException,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignInDto } from 'src/entities/auth.entity';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) {}

    async signIn(dto: SignInDto): Promise<{ access_token: string }> {
        try {
            const user = await this.usersService.findOne(dto.email);

            if (!user) {
                this.logger.warn(
                    `Sign in failed: user with email ${dto.email} not found`,
                );
                throw new UnauthorizedException('Invalid email or password');
            }

            const isPasswordValid = await bcrypt.compare(dto.pass, user.pass);
            if (!isPasswordValid) {
                this.logger.warn(
                    `Sign in failed: invalid password for ${dto.email}`,
                );
                throw new UnauthorizedException('Invalid email or password');
            }

            const payload = { sub: user.id, email: user.email };
            const token = await this.jwtService.signAsync(payload);

            this.logger.log(`User ${dto.email} signed in successfully`);
            return { access_token: token };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }

            this.logger.error(
                `Unexpected sign in error for ${dto.email}: ${error.message}`,
                error.stack,
            );
            throw new InternalServerErrorException(
                'Unexpected error during sign in',
            );
        }
    }
}
