import User from '@/user/domains/User';
import { EntityRepository, Repository } from 'typeorm';

@EntityRepository(User)
export default class UserRepository extends Repository<User> {
    async insertIfNotExists(user: User): Promise<User> {
        const createdUser = await this.createQueryBuilder()
            .insert()
            .into(User)
            .values(user)
            .onConflict(`("username") DO NOTHING`)
            .execute();
        // TODO investigate why createdUser.identifiers and createdUser.raw are not accessible
        return { ...user, id: createdUser.generatedMaps[0].id } as User;
    }
}
