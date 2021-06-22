import { SelectQueryBuilder } from 'typeorm';
import Sort from '@/common/domains/Sort';
import VocabularySearch from '@/vocabulary/domains/VocabularySearch';
import Vocabulary from '@/vocabulary/domains/Vocabulary';

const defaultSort = new Sort();

export default class VocabularySearchQueryBuilder {
    private readonly search: VocabularySearch;

    constructor(search: VocabularySearch) {
        this.search = search;
        this.search.sort = search.sort ?? defaultSort;
    }

    private filterByCohortId(query: SelectQueryBuilder<Vocabulary>): void {
        const { cohortId } = this.search;
        if (cohortId) {
            query.andWhere(`"cohortId" = :cohortId`, { cohortId });
        }
    }

    private sorting(query: SelectQueryBuilder<Vocabulary>): void {
        const { sort } = this.search;
        query.orderBy(`"${Vocabulary.name}"."${sort.field}"`, sort.direction);
    }

    private pagination(query: SelectQueryBuilder<Vocabulary>): void {
        const {
            pagination: { pageSize, pageNumber },
        } = this.search;

        const currentPage = pageSize * (pageNumber - 1);
        query.skip(currentPage);
        query.take(pageSize);
    }

    public build(query: SelectQueryBuilder<Vocabulary>): SelectQueryBuilder<Vocabulary> {
        this.filterByCohortId(query);
        this.sorting(query);
        this.pagination(query);

        return query;
    }
}
