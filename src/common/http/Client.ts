import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getClient } from '@/common/http/util';

const Client = createParamDecorator((key: string, executionContext: ExecutionContext) => {
    const request = executionContext.switchToHttp().getRequest();
    return getClient(request);
});

export default Client;
