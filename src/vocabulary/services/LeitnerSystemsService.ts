import LeitnerSystemsRepository from '@/vocabulary/repositories/LeitnerSystemsRepository';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import LeitnerSystems from '@/vocabulary/domains/LeitnerSystems';
import VocabularyRepository from '@/vocabulary/repositories/VocabularyRepository';
import Pagination from '@/common/domains/Pagination';
import * as _ from 'lodash';
import LeitnerBoxItemSearchResult, {
    SingleLeitnerItemEarlierToBoxAppearanceDate,
} from '@/vocabulary/domains/LeitnerBoxItemSearchResult';

@Injectable()
export default class LeitnerSystemsService {
    constructor(
        private readonly leitnerSystemsRepository: LeitnerSystemsRepository,
        private readonly vocabularyRepository: VocabularyRepository,
    ) {}

    async placeIntoFirstLeitnerBox(userId: string, cohortId: string, vocabularyId: string): Promise<void> {
        await this.validateVocabularyExistence(vocabularyId, cohortId);

        await this.leitnerSystemsRepository.upsert(
            LeitnerSystems.create(LeitnerBoxType.BOX_1, userId, vocabularyId, true),
        );
    }

    async moveForward(userId: string, cohortId: string, vocabularyId: string): Promise<void> {
        await this.validateVocabularyExistence(vocabularyId, cohortId);

        const boxItem = await this.getLeitnerBoxItem(userId, vocabularyId);

        if (!boxItem) {
            throw new NotFoundException(
                `There is no such vocabulary with ID "${vocabularyId}" for the user "${userId}"`,
            );
        }

        if (boxItem.currentBox === LeitnerBoxType.BOX_5) {
            throw new ConflictException(`This vocabulary is in the last Leitner box.`);
        }

        const nextBox = LeitnerBoxType[`BOX_${boxItem.currentBox + 1}`];

        await this.leitnerSystemsRepository.upsert(
            LeitnerSystems.create(nextBox, userId, vocabularyId, true).setId(boxItem.id),
        );
    }

    async moveBackward(userId: string, cohortId: string, vocabularyId: string): Promise<void> {
        await this.validateVocabularyExistence(vocabularyId, cohortId);

        const boxItem = await this.getLeitnerBoxItem(userId, vocabularyId);

        if (!boxItem) {
            throw new NotFoundException(
                `There is no such vocabulary with ID "${vocabularyId}" for the user "${userId}"`,
            );
        }

        if (boxItem.currentBox === LeitnerBoxType.BOX_1) {
            throw new ConflictException(`This vocabulary is in the first Leitner box.`);
        }

        const previousBox = LeitnerBoxType[`BOX_${boxItem.currentBox - 1}`];

        await this.leitnerSystemsRepository.upsert(
            LeitnerSystems.create(previousBox, userId, vocabularyId, false).setId(boxItem.id),
        );
    }

    private async validateVocabularyExistence(vocabularyId: string, cohortId: string): Promise<void> {
        if (!(await this.vocabularyRepository.isVocabularyExist(vocabularyId, cohortId))) {
            throw new NotFoundException(`There is no such vocabulary with ID "${vocabularyId}"`);
        }
    }

    private getLeitnerBoxItem(userId: string, vocabularyId: string): Promise<LeitnerSystems> {
        return this.leitnerSystemsRepository.findOne({ user: { id: userId }, vocabulary: { id: vocabularyId } });
    }

    async getBoxItems(
        userId: string,
        box: LeitnerBoxType,
        pagination: Pagination,
    ): Promise<LeitnerBoxItemSearchResult> {
        const { results, total } = await this.leitnerSystemsRepository.getBoxItems(userId, box, pagination);
        const items = _.map(results, (result) => {
            return {
                vocabularyId: result.vocabularyId,
                word: result.vocabulary.word,
                updatedAt: result.updatedAt,
            };
        });
        let singleLeitnerItemEarlierToBoxAppearanceDate: SingleLeitnerItemEarlierToBoxAppearanceDate;
        if (!total) {
            singleLeitnerItemEarlierToBoxAppearanceDate = await this.getSingleLeitnerItemEarlierToBoxAppearanceDate(
                userId,
                box,
            );
        }
        return new LeitnerBoxItemSearchResult(items, total, singleLeitnerItemEarlierToBoxAppearanceDate);
    }

    private async getSingleLeitnerItemEarlierToBoxAppearanceDate(
        userId: string,
        box: LeitnerBoxType,
    ): Promise<SingleLeitnerItemEarlierToBoxAppearanceDate> {
        const item = await this.leitnerSystemsRepository.getSingleBoxItem(userId, box);
        let singleLeitnerItemEarlierToBoxAppearanceDate: SingleLeitnerItemEarlierToBoxAppearanceDate;
        if (item) {
            singleLeitnerItemEarlierToBoxAppearanceDate = {
                boxAppearanceDate: item.boxAppearanceDate,
                vocabulary: { word: item.vocabulary.word },
            };
        }
        return singleLeitnerItemEarlierToBoxAppearanceDate;
    }

    countBoxItems(userId: string, box: LeitnerBoxType): Promise<number> {
        return this.leitnerSystemsRepository.countBoxItems(userId, box);
    }
}
