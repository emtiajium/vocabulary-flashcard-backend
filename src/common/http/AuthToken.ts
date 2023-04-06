import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getJwToken } from '@/common/http/util';

const AuthToken = createParamDecorator((key: string, executionContext: ExecutionContext) => {
    const request = executionContext.switchToHttp().getRequest();
    return getJwToken(request);
});

export default AuthToken;
