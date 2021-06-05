import User from '@/user/domains/User';
import { EntityRepository, Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';

@EntityRepository(User)
export default class UserRepository extends Repository<User> {
    async insertIfNotExists(user: User): Promise<User> {
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
}
