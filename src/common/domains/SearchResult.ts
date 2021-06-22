export default class SearchResult<T> {
    constructor(readonly results: T[], readonly total: number) {}
}
