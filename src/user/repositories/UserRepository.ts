import User from '@/user/domains/User';
import { DataSource, In, Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { SortDirection } from '@/common/domains/Sort';
import { Injectable } from '@nestjs/common';

@Injectable()
export default class UserRepository extends Repository<User> {
    constructor(private dataSource: DataSource) {
        super(User, dataSource.createEntityManager());
    }

    async upsertII(user: User): Promise<User> {
        const createdUserResponse = await this.query(
            `
                INSERT INTO "User"("createdAt", "updatedAt", "version", "id", "username", "firstname", "lastname",
                                   "profilePictureUrl", "cohortId")
                VALUES (DEFAULT, DEFAULT, 1, DEFAULT, $1, $2, $3, $4, DEFAULT)
                ON CONFLICT ("username") DO UPDATE SET firstname           = EXCLUDED.firstname,
                                                       lastname            = EXCLUDED.lastname,
                                                       "profilePictureUrl" = EXCLUDED."profilePictureUrl",
                                                       "updatedAt"         = NOW(),
                                                       version             = "User".version + 1
                RETURNING "createdAt", "updatedAt", "version", "id"
            `,
            [user.username, user.firstname, user.lastname, user.profilePictureUrl],
        );

        return plainToInstance(User, { ...user, ...createdUserResponse[0] });
    }

    getUsersByUsernames(usernames: string[]): Promise<User[]> {
        return this.findBy({ username: In(usernames) });
    }

    async updateCohort(usernames: string[], cohortId: string): Promise<void> {
        await this.update({ username: In(usernames) }, { cohort: { id: cohortId } });
    }

    getAll(): Promise<User[]> {
        return this.createQueryBuilder('user')
            .innerJoin('user.cohort', 'cohort')
            .select(['user.username', 'user.firstname', 'user.lastname', 'user.createdAt'])
            .addSelect(['cohort.name'])
            .orderBy({ 'user.createdAt': SortDirection.ASC })
            .getMany();
    }

    async removeById(id: string): Promise<void> {
        await this.delete({ id });
    }
}
