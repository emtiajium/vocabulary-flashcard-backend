import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import GuessingGame from '@/vocabulary/domains/GuessingGame';

@Injectable()
export default class GuessingGameRepository extends Repository<GuessingGame> {
    constructor(private dataSource: DataSource) {
        super(GuessingGame, dataSource.createEntityManager());
    }

    async insertMultiples(definitionIds: string[], userId: string): Promise<void> {
        await this.insert(
            definitionIds.map((definitionId) => {
                return {
                    userId,
                    definitionId,
                };
            }),
        );
    }

    async getDefinitionIdsByUserId(userId: string): Promise<string[]> {
        const guessingGames = await this.find({ where: { userId }, select: ['definitionId'] });
        return guessingGames.map(({ definitionId }) => definitionId);
    }

    async deleteOlder(): Promise<void> {
        await this.query(`
            delete
            from "GuessingGame"
            where "createdAt" < now() - '15 days'::interval
        `);
    }

    async deleteByUserId(userId: string): Promise<void> {
        await this.query(
            `
                delete
                from "GuessingGame"
                where "userId" = $1;
            `,
            [userId],
        );
    }
}
