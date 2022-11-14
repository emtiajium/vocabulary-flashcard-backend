import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import User from '@/user/domains/User';

const AuthenticatedUser = createParamDecorator((data: unknown, executionContext: ExecutionContext) => {
    const request = executionContext.switchToHttp().getRequest();
    return plainToClass(User, request.user);
});

export default AuthenticatedUser;
