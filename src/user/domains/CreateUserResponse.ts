export interface CreateUserResponse {
    username: string;
    name: string;
    profilePictureUrl: string;
    accessToken?: string;
    refreshToken?: string;
}
