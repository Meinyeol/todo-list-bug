import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUser } from 'src/interfaces/current-user.interface';

export const CurrentUserDecorator = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): CurrentUser => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);
