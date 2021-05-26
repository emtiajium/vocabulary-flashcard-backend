import EnvVars from '@/common/EnvVars';

export default function getAppAPIPrefix(): string {
    return EnvVars.get('SERVICE_API_PREFIX');
}
