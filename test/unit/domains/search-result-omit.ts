import SearchResult from '@/common/domains/SearchResult';

describe('SearchResult: omit', () => {
    test('undefined', () => {
        // Arrange
        const rawResults = undefined;
        const nameHoldingTotalRows = 'total';

        // Act
        const searchResult = SearchResult.omitTotal(rawResults, nameHoldingTotalRows);

        // Assert
        expect(searchResult.results).toStrictEqual([]);
        expect(searchResult.total).toBe(0);
    });

    test('null', () => {
        // Arrange
        const rawResults = null;
        const nameHoldingTotalRows = 'total';

        // Act
        const searchResult = SearchResult.omitTotal(rawResults, nameHoldingTotalRows);

        // Assert
        expect(searchResult.results).toStrictEqual([]);
        expect(searchResult.total).toBe(0);
    });

    test('empty array', () => {
        // Arrange
        const rawResults = [];
        const nameHoldingTotalRows = 'total';

        // Act
        const searchResult = SearchResult.omitTotal(rawResults, nameHoldingTotalRows);

        // Assert
        expect(searchResult.results).toStrictEqual([]);
        expect(searchResult.total).toBe(0);
    });

    test('non-empty array', () => {
        // Arrange
        const rawResults = [
            { anyKey: 'value 1', total: 2 },
            { anyKey: 'value 2', total: 2 },
        ];
        const nameHoldingTotalRows = 'total';

        // Act
        const searchResult = SearchResult.omitTotal(rawResults, nameHoldingTotalRows);

        // Assert
        expect(searchResult.results).toStrictEqual([{ anyKey: 'value 1' }, { anyKey: 'value 2' }]);
        expect(searchResult.total).toBe(2);
    });
});
