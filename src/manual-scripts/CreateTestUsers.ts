import User from '@/user/domains/User';
import { createConnection, getRepository, In } from 'typeorm';
import Cohort from '@/user/domains/Cohort';
import * as _ from 'lodash';

type PartialUser = Pick<User, 'firstname' | 'lastname' | 'username' | 'profilePictureUrl'>;

export default class CreateTestUsers {
    private readonly users: PartialUser[] = [
        {
            firstname: `Kateryna`,
            lastname: `Shevchenko`,
            username: `kateryna.shevchenko@firecracker.com`,
            profilePictureUrl: ``,
        },
        {
            firstname: `Joao da`,
            lastname: `Silva`,
            username: `joao.silva@firecracker.com`,
            profilePictureUrl: ``,
        },
        {
            firstname: `Shashwata`,
            lastname: `Noor`,
            username: `shashwata.noor@firecracker.com`,
            profilePictureUrl: ``,
        },
        {
            firstname: `Shraban`,
            lastname: `Dhara`,
            username: `shraban.dhara@firecracker.com`,
            profilePictureUrl: ``,
        },
    ];

    private readonly cohortName = `Fantastic Four!`;

    private cohortId: string;

    async execute(): Promise<void> {
        try {
            await createConnection();
            await this.removeUsers();
            await this.removeCohort();
            await Promise.all([this.createCohort(), this.createUsers()]);
            await this.associateUsersWithCohort();
        } catch (error) {
            console.log(`Error`, error);
        }
    }

    private async removeCohort(): Promise<void> {
        await getRepository(Cohort).delete({ name: this.cohortName });
    }

    private async createCohort(): Promise<void> {
        this.cohortId = (await getRepository(Cohort).save({ name: this.cohortName, userIds: [] })).id;
    }

    private async removeUsers(): Promise<void> {
        await getRepository(User).delete({ username: In(_.map(this.users, 'username')) });
    }

    private async createUsers(): Promise<void> {
        await getRepository(User).insert(this.users);
    }

    private async associateUsersWithCohort(): Promise<void> {
        await getRepository(User).update(
            { username: In(_.map(this.users, 'username')) },
            { cohort: { id: this.cohortId } },
        );
    }
}

(async function executeScript(): Promise<void> {
    await new CreateTestUsers().execute();
    process.exit(0);
})();
