import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import User from '@/user/domains/User';

const AuthenticatedUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return plainToClass(User, request.user);
});

export default AuthenticatedUser;
