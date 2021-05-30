import { ConfigService } from '@nestjs/config';

export default function getAppAPIPrefix(): string {
    return new ConfigService().get<string>('SERVICE_API_PREFIX');
}
