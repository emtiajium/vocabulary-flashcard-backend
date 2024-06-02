import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import GuessingGame from '@/vocabulary/domains/GuessingGame';

@Injectable()
export default class GuessingGameRepository extends Repository<GuessingGame> {
    constructor(private dataSource: DataSource) {
        super(GuessingGame, dataSource.createEntityManager());
    }

    async insertMultiples(guessingGames: Partial<GuessingGame>[], userId: string): Promise<void> {
        await this.insert(
            guessingGames.map((guessingGame) => {
                return {
                    userId,
                    definitionId: guessingGame.definitionId,
                    word: guessingGame.word,
                    meaning: guessingGame.meaning,
                };
            }),
        );
    }

    getDefinitionsByUserId(userId: string): Promise<
        {
            definitionId: string;
            word: string;
            meaning: string;
            isCreationDateToday: boolean;
        }[]
    > {
        return this.query(
            `
                select "definitionId",
                       word,
                       meaning,
                       ("createdAt"::date = now()::date) as "isCreationDateToday"
                from "GuessingGame"
                where "userId" = $1;
            `,
            [userId],
        );
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
