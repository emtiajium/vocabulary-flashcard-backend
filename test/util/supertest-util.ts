export interface SupertestErrorResponse {
    statusCode: number;
    message: string | string[];
    error: string;
    name?: string;
}

export default interface SupertestResponse<T> {
    status: number;
    body?: T | SupertestErrorResponse;
    text?: string;
}
