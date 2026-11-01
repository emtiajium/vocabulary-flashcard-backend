import { TokenResponse } from '@/user/domains/TokenResponse';

export interface CreateUserResponse extends TokenResponse {
    username: string;
    name: string;
    profilePictureUrl: string;
}
