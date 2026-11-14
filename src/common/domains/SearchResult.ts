type RawResult<T, U> = T & U;

export default class SearchResult<T> {
    constructor(
        readonly results: T[],
        readonly total: number,
    ) {}

    static omitTotal<T extends object, U extends Record<string, number>>(
        rawResults: RawResult<T, U>[],
        nameHoldingTotalRows: keyof U & string,
    ): SearchResult<T> {
        if ((rawResults ?? []).length === 0) {
            return new SearchResult<T>([], 0);
        }

        const total = rawResults[0]?.[nameHoldingTotalRows];

        const results = rawResults.map((result) => {
            const { [nameHoldingTotalRows]: _total, ...resultWithoutTotal } = result;

            return resultWithoutTotal as T;
        });

        return new SearchResult<T>(results, total);
    }
}
