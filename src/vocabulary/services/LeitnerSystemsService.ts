import LeitnerSystemsRepository from '@/vocabulary/repositories/LeitnerSystemsRepository';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import LeitnerSystems from '@/vocabulary/domains/LeitnerSystems';

@Injectable()
export default class LeitnerSystemsService {
    constructor(private readonly leitnerSystemsRepository: LeitnerSystemsRepository) {}

    async placeIntoFirstLeitnerBox(userId: string, vocabularyId: string): Promise<void> {
        const boxItem = await this.getLeitnerBoxItem(userId, vocabularyId);

        if (boxItem) {
            throw new ConflictException(
                `Vocabulary with ID "${vocabularyId}" for the user "${userId}" is already exist`,
            );
        }

        await this.leitnerSystemsRepository.save(
            LeitnerSystems.create(LeitnerBoxType.BOX_1, userId, vocabularyId, true),
        );
    }

    async moveForward(userId: string, vocabularyId: string): Promise<void> {
        const boxItem = await this.getLeitnerBoxItem(userId, vocabularyId);

        if (!boxItem) {
            throw new NotFoundException(
                `There is no such vocabulary with ID "${vocabularyId}" for the user "${userId}"`,
            );
        }

        await this.leitnerSystemsRepository.update(
            { id: boxItem.id },
            LeitnerSystems.create(LeitnerBoxType[`BOX_${boxItem.currentBox + 1}`], userId, vocabularyId, true),
        );
    }

    async moveBackward(userId: string, vocabularyId: string): Promise<void> {
        const boxItem = await this.getLeitnerBoxItem(userId, vocabularyId);

        if (!boxItem) {
            throw new NotFoundException(
                `There is no such vocabulary with ID "${vocabularyId}" for the user "${userId}"`,
            );
        }

        await this.leitnerSystemsRepository.update(
            { id: boxItem.id },
            LeitnerSystems.create(LeitnerBoxType[`BOX_${boxItem.currentBox - 1}`], userId, vocabularyId, false),
        );
    }

    private async getLeitnerBoxItem(userId: string, vocabularyId: string): Promise<LeitnerSystems> {
        return this.leitnerSystemsRepository.findOne({ userId, vocabularyId });
    }
}
