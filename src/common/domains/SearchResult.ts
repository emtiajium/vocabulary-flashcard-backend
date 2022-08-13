type RawResult<T, U> = T & U;

export default class SearchResult<T> {
    constructor(readonly results: T[], readonly total: number) {}

    static omitTotal<T, U>(rawResults: RawResult<T, U>[], nameHoldingTotalRows: string): SearchResult<T> {
        const isNotEmpty = rawResults?.length > 0;
        const total = isNotEmpty ? rawResults[0][nameHoldingTotalRows] : 0;

        const results: T[] = (rawResults || []).map((result) => {
            const resultWithoutTotal = {} as T;

            Object.keys(result).forEach((key) => {
                if (key !== nameHoldingTotalRows) {
                    resultWithoutTotal[key] = result[key];
                }
            });

            return resultWithoutTotal;
        });

        return new SearchResult<T>(results, total);
    }
}
