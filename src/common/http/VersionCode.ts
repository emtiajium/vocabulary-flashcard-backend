import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getVersionCode } from '@/common/http/util';

const VersionCode = createParamDecorator((data: string, executionContext: ExecutionContext) => {
    const request = executionContext.switchToHttp().getRequest();
    return getVersionCode(request);
});

export default VersionCode;
