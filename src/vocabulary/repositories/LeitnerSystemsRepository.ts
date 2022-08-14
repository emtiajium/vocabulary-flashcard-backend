import { EntityRepository, Repository } from 'typeorm';
import LeitnerSystems from '@/vocabulary/domains/LeitnerSystems';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import SearchResult from '@/common/domains/SearchResult';
import Pagination from '@/common/domains/Pagination';
import { getFormattedTomorrow } from '@/common/utils/moment-util';
import LeitnerSystemsLoverUsersReport from '@/user/domains/LeitnerSystemsLoverUsersReport';
import { SortDirection } from '@/common/domains/Sort';

@EntityRepository(LeitnerSystems)
export default class LeitnerSystemsRepository extends Repository<LeitnerSystems> {
    // shitty code just for the easiness of jest.spyOn()
    getTomorrow(): string {
        return getFormattedTomorrow();
    }

    async getBoxItems(
        userId: string,
        box: LeitnerBoxType,
        pagination: Pagination,
    ): Promise<SearchResult<LeitnerSystems>> {
        const { pageSize, pageNumber } = pagination;
        const toBeSkipped = pageSize * (pageNumber - 1);

        const [items, total] = await this.createQueryBuilder('leitnerSystems')
            .innerJoin('leitnerSystems.user', 'user', 'user.id = :userId', {
                userId,
            })
            .innerJoin('leitnerSystems.vocabulary', 'vocabulary')
            .where('user.id = :userId', { userId })
            .andWhere('leitnerSystems.currentBox = :box', { box })
            .andWhere(`leitnerSystems.boxAppearanceDate < '${this.getTomorrow()}'::DATE`)
            .orderBy('leitnerSystems.createdAt', SortDirection.ASC)
            .skip(toBeSkipped)
            .take(pageSize)
            .select(['leitnerSystems.id', 'leitnerSystems.createdAt', 'leitnerSystems.updatedAt'])
            .addSelect(['vocabulary.id'])
            .getManyAndCount();

        return new SearchResult<LeitnerSystems>(items, total);
    }

    countBoxItems(userId: string, box: LeitnerBoxType): Promise<number> {
        return this.count({
            where: {
                user: { id: userId },
                currentBox: box,
            },
        });
    }

    getLeitnerLoverUsers(): Promise<LeitnerSystemsLoverUsersReport[]> {
        return this.query(`
            SELECT DISTINCT U.username, COUNT(DISTINCT "vocabularyId")::INTEGER AS "vocabCount"
            FROM "LeitnerSystems"
                     INNER JOIN "User" AS U ON "LeitnerSystems"."userId" = U.id
            GROUP BY U.username
            ORDER BY "vocabCount" DESC;
        `);
    }
}
