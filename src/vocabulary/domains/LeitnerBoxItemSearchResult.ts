import SearchResult from '@/common/domains/SearchResult';
import LeitnerBoxItem from '@/vocabulary/domains/LeitnerBoxItem';

export type SingleLeitnerItemEarlierToBoxAppearanceDate = { boxAppearanceDate: Date; vocabulary: { word: string } };

export default class LeitnerBoxItemSearchResult extends SearchResult<LeitnerBoxItem> {
    constructor(
        readonly results: LeitnerBoxItem[],
        readonly total: number,
        readonly singleLeitnerItemEarlierToBoxAppearanceDate?: SingleLeitnerItemEarlierToBoxAppearanceDate,
    ) {
        super(results, total);
    }
}
