import { createConnection, getConnectionManager, getRepository } from 'typeorm';
import LeitnerSystems from '@/vocabulary/domains/LeitnerSystems';

export default class RemoveDuplicateItemFromLeitnerBox {
    async execute(): Promise<void> {
        try {
            // TODO remove the condition
            // workaround as couldn't find a way to execute the script in a separate thread in AEB
            if (!getConnectionManager().has('default')) {
                await createConnection();
            }
            await this.remove();
        } catch (error) {
            console.log(`Error while removing item`, error);
        }
    }

    private async remove(): Promise<void> {
        await getRepository(LeitnerSystems).query(
            `DELETE
             FROM "LeitnerSystems"
             WHERE "vocabularyId" = $1
               AND "userId" = $2;`,
            ['0338d7b3-bf92-4593-b60c-b1843af05277', '0aad83c6-a545-49b0-b561-d11d83577e09'],
        );
    }
}
