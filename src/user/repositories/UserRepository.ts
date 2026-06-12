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

    async insertOrUpdate(user: User): Promise<User> {
        const createdUserResponse = await this.query(
            /* sql */ `
                insert into
                    "User" (
                        "createdAt",
                        "updatedAt",
                        "version",
                        "id",
                        "username",
                        "firstname",
                        "lastname",
                        "profilePictureUrl",
                        "cohortId"
                    )
                values
                    (
                        default,
                        default,
                        1,
                        default,
                        $1,
                        $2,
                        $3,
                        $4,
                        default
                    )
                on conflict ("username") do update
                set
                    firstname = excluded.firstname,
                    lastname = excluded.lastname,
                    "profilePictureUrl" = excluded."profilePictureUrl",
                    "updatedAt" = now(),
                    version = "User".version + 1
                returning
                    "createdAt",
                    "updatedAt",
                    "version",
                    "id"
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
            .orderBy({ 'user.createdAt': SortDirection.DESC })
            .getMany();
    }

    async removeById(id: string): Promise<void> {
        await this.delete({ id });
    }
}
