import User from '@/user/domains/User';
import { EntityRepository, In, Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { SortDirection } from '@/common/domains/Sort';

@EntityRepository(User)
export default class UserRepository extends Repository<User> {
    async insertAndUpdateIfExist(user: User): Promise<User> {
        // possible to get the column names by accessing "this.metadata.propertiesMap"
        const updateActionOnConflict = `SET firstname = EXCLUDED.firstname,
            lastname = EXCLUDED.lastname,
            "profilePictureUrl" = EXCLUDED."profilePictureUrl",
            "updatedAt" = NOW(),
            version = "${this.metadata.tableName}".version + 1`;

        const createdUser = await this.createQueryBuilder()
            .insert()
            .into(User)
            .values(user)
            .onConflict(`("username") DO UPDATE ${updateActionOnConflict}`)
            .execute();

        return plainToClass(User, { ...user, ...createdUser.generatedMaps[0] });
    }

    getUsers(ids: string[]): Promise<User[]> {
        return this.find({ id: In(ids) });
    }

    getUsersByUsernames(usernames: string[]): Promise<User[]> {
        return this.find({ username: In(usernames) });
    }

    async updateCohort(usernames: string[], cohortId: string): Promise<void> {
        await this.update({ username: In(usernames) }, { cohort: { id: cohortId } });
    }

    getAll(): Promise<User[]> {
        return this.find({
            relations: ['cohort'],
            select: ['username', 'firstname', 'lastname', 'createdAt'],
            order: { createdAt: SortDirection.ASC },
        });
    }
}
