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

    getByUserId(userId: string): Promise<
        {
            definitionId: string;
            word: string;
            meaning: string;
            isCreationDateToday: boolean;
            completedAt: Date | null;
        }[]
    > {
        return this.query(
            /* sql */ `
                select
                    "definitionId",
                    word,
                    meaning,
                    ("createdAt"::date = now()::date) as "isCreationDateToday",
                    "completedAt"
                from
                    "GuessingGame"
                where
                    "userId" = $1;
            `,
            [userId],
        );
    }

    async completeTodaysByUserId(userId: string): Promise<void> {
        await this.query(
            /* sql */ `
                update "GuessingGame"
                set
                    "completedAt" = now()
                where
                    "userId" = $1
                    and "createdAt"::date = now()::date
                    and "completedAt" is null;
            `,
            [userId],
        );
    }

    async deleteOlder(): Promise<void> {
        await this.query(/* sql */ `
            delete from "GuessingGame"
            where
                "createdAt" < now() - '15 days'::interval
        `);
    }

    async deleteByUserId(userId: string): Promise<void> {
        await this.query(
            /* sql */ `
                delete from "GuessingGame"
                where
                    "userId" = $1;
            `,
            [userId],
        );
    }
}
