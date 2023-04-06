import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import User from '@/user/domains/User';

const AuthenticatedUser = createParamDecorator((key: string, executionContext: ExecutionContext) => {
    const request = executionContext.switchToHttp().getRequest();
    const user = plainToClass(User, request.user);
    return key ? user[key] : user;
});

export default AuthenticatedUser;
