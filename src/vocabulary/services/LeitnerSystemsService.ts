import LeitnerSystemsRepository from '@/vocabulary/repositories/LeitnerSystemsRepository';
import { Injectable, NotFoundException } from '@nestjs/common';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import LeitnerSystems from '@/vocabulary/domains/LeitnerSystems';

@Injectable()
export default class LeitnerSystemsService {
    constructor(private readonly leitnerSystemsRepository: LeitnerSystemsRepository) {}

    async moveToNextLeitnerBox(box: LeitnerBoxType, userId: string, vocabularyId: string): Promise<void> {
        const boxItem = await this.getLeitnerBoxItem(userId, vocabularyId);

        if (!boxItem && box > LeitnerBoxType.BOX_1) {
            throw new NotFoundException(
                `There is no such vocabulary with ID "${vocabularyId}" for the user "${userId}"`,
            );
        }

        await (box === 1
            ? this.leitnerSystemsRepository.save(LeitnerSystems.create(box, userId, vocabularyId, true))
            : this.leitnerSystemsRepository.update(
                  { id: boxItem.id },
                  LeitnerSystems.create(box, userId, vocabularyId, true),
              ));
    }

    async moveToPreviousLeitnerBox(box: LeitnerBoxType, userId: string, vocabularyId: string): Promise<void> {
        const boxItem = await this.getLeitnerBoxItem(userId, vocabularyId);

        if (!boxItem) {
            throw new NotFoundException(
                `There is no such vocabulary with ID "${vocabularyId}" for the user "${userId}"`,
            );
        }

        await this.leitnerSystemsRepository.update(
            { id: boxItem.id },
            LeitnerSystems.create(box, userId, vocabularyId, false),
        );
    }

    private async getLeitnerBoxItem(userId: string, vocabularyId: string): Promise<LeitnerSystems> {
        return this.leitnerSystemsRepository.findOne({ userId, vocabularyId });
    }
}
