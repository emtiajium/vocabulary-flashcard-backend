import LeitnerSystems from '@/vocabulary/domains/LeitnerSystems';
import DataSource from '@/common/persistence/TypeormConfig';

export default class RemoveDuplicateItemFromLeitnerBox {
    async execute(): Promise<void> {
        try {
            await this.remove();
        } catch (error) {
            console.error(`Error while removing item`, error);
        }
    }

    private async remove(): Promise<void> {
        await DataSource.getRepository(LeitnerSystems).query(
            `DELETE
             FROM "LeitnerSystems"
             WHERE "vocabularyId" = $1
               AND "userId" = $2;`,
            ['0338d7b3-bf92-4593-b60c-b1843af05277', '0aad83c6-a545-49b0-b561-d11d83577e09'],
        );
    }
}
