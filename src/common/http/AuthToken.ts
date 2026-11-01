import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getAccessToken, getRefreshToken } from '@/common/http/util';

const AuthToken = createParamDecorator((key: string, executionContext: ExecutionContext) => {
    const request = executionContext.switchToHttp().getRequest();
    return getAccessToken(request);
});

const RefreshAuthToken = createParamDecorator((key: string, executionContext: ExecutionContext) => {
    const request = executionContext.switchToHttp().getRequest();
    return getRefreshToken(request);
});

export default AuthToken;
export { RefreshAuthToken };
