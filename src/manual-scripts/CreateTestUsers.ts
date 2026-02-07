import User from '@/user/domains/User';
import { In } from 'typeorm';
import Cohort from '@/user/domains/Cohort';
import * as _ from 'lodash';
import Definition from '@/vocabulary/domains/Definition';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import DataSource from '@/common/persistence/TypeormConfig';

type PartialUser = Pick<User, 'firstname' | 'lastname' | 'username' | 'profilePictureUrl'>;

export default class CreateTestUsers {
    private readonly users: PartialUser[] = [
        {
            firstname: `Joao da`,
            lastname: `Silva`,
            username: `jsilva@firecrackervocabulary.com`,
            profilePictureUrl: `https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairDreads01&accessoriesType=Prescription01&hairColor=Brown&facialHairType=Blank&clotheType=Hoodie&clotheColor=Gray02&eyeType=Default&eyebrowType=DefaultNatural&mouthType=Default&skinColor=Brown`,
        },
        {
            firstname: `Kateryna`,
            lastname: `Lagno`,
            username: `klagno@firecrackervocabulary.com`,
            profilePictureUrl: `https://avataaars.io/?avatarStyle=Transparent&topType=LongHairCurvy&accessoriesType=Blank&hairColor=Blonde&facialHairType=Blank&clotheType=Overall&clotheColor=PastelGreen&eyeType=Default&eyebrowType=DefaultNatural&mouthType=Default&skinColor=Light`,
        },
        {
            firstname: `Shashwata`,
            lastname: `Noor`,
            username: `snoor@firecrackervocabulary.com`,
            profilePictureUrl: `https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortFlat&accessoriesType=Blank&hairColor=Black&facialHairType=BeardLight&facialHairColor=Black&clotheType=BlazerSweater&eyeType=Default&eyebrowType=DefaultNatural&mouthType=Default&skinColor=DarkBrown`,
        },
        {
            firstname: `Shraban`,
            lastname: `Dhara`,
            username: `sdhara@firecrackervocabulary.com`,
            profilePictureUrl: `https://avataaars.io/?avatarStyle=Transparent&topType=LongHairStraight2&accessoriesType=Prescription02&hairColor=Black&facialHairType=Blank&clotheType=CollarSweater&clotheColor=Blue03&eyeType=Default&eyebrowType=DefaultNatural&mouthType=Default&skinColor=Brown`,
        },
    ];

    private readonly cohortName = `Fantastic Four!`;

    private cohortId: string;

    async execute(): Promise<void> {
        try {
            await DataSource.initialize();
            await this.removeDefinitions();
            await this.removeVocabularies();
            await this.removeUsers();
            await this.removeCohort();
            await Promise.all([this.createCohort(), this.createUsers()]);
            await this.associateUsersWithCohort();
        } catch (error) {
            console.error(`Error`, error);
        } finally {
            await DataSource.destroy();
        }
    }

    private async removeDefinitions(): Promise<void> {
        await DataSource.getRepository(Definition).query(
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
        await DataSource.getRepository(Vocabulary).query(
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
        await DataSource.getRepository(Cohort).delete({ name: this.cohortName });
    }

    private async createCohort(): Promise<void> {
        this.cohortId = (await DataSource.getRepository(Cohort).save({ name: this.cohortName, userIds: [] })).id;
    }

    private async removeUsers(): Promise<void> {
        await DataSource.getRepository(User).delete({ username: In(_.map(this.users, 'username')) });
    }

    private async createUsers(): Promise<void> {
        await DataSource.getRepository(User).insert(this.users);
    }

    private async associateUsersWithCohort(): Promise<void> {
        await DataSource.getRepository(User).update(
            { username: In(_.map(this.users, 'username')) },
            { cohort: { id: this.cohortId } },
        );
    }
}

(async function executeScript(): Promise<void> {
    await new CreateTestUsers().execute();
    process.exit(0);
})();
