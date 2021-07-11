import User from '@/user/domains/User';
import { createConnection, getRepository, In } from 'typeorm';
import Cohort from '@/user/domains/Cohort';
import * as _ from 'lodash';
import Definition from '@/vocabulary/domains/Definition';
import Vocabulary from '@/vocabulary/domains/Vocabulary';

type PartialUser = Pick<User, 'firstname' | 'lastname' | 'username' | 'profilePictureUrl'>;

export default class CreateTestUsers {
    private readonly users: PartialUser[] = [
        {
            firstname: `Kateryna`,
            lastname: `Shevchenko`,
            username: `k.shevchenko@firecracker.com`,
            profilePictureUrl: `https://avataaars.io/?avatarStyle=Transparent&topType=LongHairCurvy&accessoriesType=Blank&hairColor=Blonde&facialHairType=Blank&clotheType=Overall&clotheColor=PastelGreen&eyeType=Default&eyebrowType=DefaultNatural&mouthType=Default&skinColor=Light`,
        },
        {
            firstname: `Joao da`,
            lastname: `Silva`,
            username: `j.silva@firecracker.com`,
            profilePictureUrl: `https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairDreads01&accessoriesType=Prescription01&hairColor=Brown&facialHairType=Blank&clotheType=Hoodie&clotheColor=Gray02&eyeType=Default&eyebrowType=DefaultNatural&mouthType=Default&skinColor=Brown`,
        },
        {
            firstname: `Shashwata`,
            lastname: `Noor`,
            username: `s.noor@firecracker.com`,
            profilePictureUrl: `https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortFlat&accessoriesType=Blank&hairColor=Black&facialHairType=BeardLight&facialHairColor=Black&clotheType=BlazerSweater&eyeType=Default&eyebrowType=DefaultNatural&mouthType=Default&skinColor=DarkBrown`,
        },
        {
            firstname: `Shraban`,
            lastname: `Dhara`,
            username: `s.dhara@firecracker.com`,
            profilePictureUrl: `https://avataaars.io/?avatarStyle=Transparent&topType=LongHairStraight2&accessoriesType=Prescription02&hairColor=Black&facialHairType=Blank&clotheType=CollarSweater&clotheColor=Blue03&eyeType=Default&eyebrowType=DefaultNatural&mouthType=Default&skinColor=Brown`,
        },
    ];

    private readonly cohortName = `Fantastic Four!`;

    private cohortId: string;

    async execute(): Promise<void> {
        try {
            await createConnection();
            await this.removeDefinitions();
            await this.removeVocabularies();
            await this.removeUsers();
            await this.removeCohort();
            await Promise.all([this.createCohort(), this.createUsers()]);
            await this.associateUsersWithCohort();
        } catch (error) {
            console.log(`Error`, error);
        }
    }

    private async removeDefinitions(): Promise<void> {
        await getRepository(Definition).query(
            `DELETE
             FROM "Definition"
             WHERE "vocabularyId" IN (
                 SELECT id
                 FROM "Vocabulary"
                 WHERE "cohortId" = (
                     SELECT id
                     FROM "Cohort"
                     WHERE name = $1
                 )
             );`,
            [this.cohortName],
        );
    }

    private async removeVocabularies(): Promise<void> {
        await getRepository(Vocabulary).query(
            `
                DELETE
                FROM "Vocabulary"
                WHERE "cohortId" = (
                    SELECT id
                    FROM "Cohort"
                    WHERE name = $1
                )
            `,
            [this.cohortName],
        );
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
