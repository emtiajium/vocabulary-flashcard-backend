export default interface SupertestResponse<T> {
    status: number;
    body: T;
}
