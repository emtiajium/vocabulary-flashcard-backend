import { EntityRepository, Raw, Repository } from 'typeorm';
import LeitnerSystems from '@/vocabulary/domains/LeitnerSystems';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import SearchResult from '@/common/domains/SearchResult';
import Pagination from '@/common/domains/Pagination';
import { getToday } from '@/common/utils/moment-util';

@EntityRepository(LeitnerSystems)
export default class LeitnerSystemsRepository extends Repository<LeitnerSystems> {
    async getBoxItems(
        userId: string,
        box: LeitnerBoxType,
        pagination: Pagination,
    ): Promise<SearchResult<LeitnerSystems>> {
        const { pageSize, pageNumber } = pagination;
        const toBeSkipped = pageSize * (pageNumber - 1);

        const [items, total] = await this.findAndCount({
            where: {
                userId,
                currentBox: box,
                boxAppearanceDate: Raw((alias) => `${alias} <= '${getToday()}'::DATE`),
            },
            select: ['vocabularyId'],
            skip: toBeSkipped,
            take: pageSize,
        });

        return new SearchResult<LeitnerSystems>(items, total);
    }
}
