import LeitnerSystemsRepository from '@/vocabulary/repositories/LeitnerSystemsRepository';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import LeitnerSystems from '@/vocabulary/domains/LeitnerSystems';
import VocabularyRepository from '@/vocabulary/repositories/VocabularyRepository';
import Pagination from '@/common/domains/Pagination';
import SearchResult from '@/common/domains/SearchResult';
import * as _ from 'lodash';
import LeitnerBoxItem from '@/vocabulary/domains/LeitnerBoxItem';
import Vocabulary from '@/vocabulary/domains/Vocabulary';

@Injectable()
export default class LeitnerSystemsService {
    constructor(
        private readonly leitnerSystemsRepository: LeitnerSystemsRepository,
        private readonly vocabularyRepository: VocabularyRepository,
    ) {}

    async placeIntoFirstLeitnerBox(userId: string, cohortId: string, vocabularyId: string): Promise<void> {
        if (!(await this.vocabularyRepository.isVocabularyExist(vocabularyId, cohortId))) {
            throw new NotFoundException(`There is no such vocabulary with ID "${vocabularyId}"`);
        }

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

    async moveForward(userId: string, cohortId: string, vocabularyId: string): Promise<void> {
        if (!(await this.vocabularyRepository.isVocabularyExist(vocabularyId, cohortId))) {
            throw new NotFoundException(`There is no such vocabulary with ID "${vocabularyId}"`);
        }

        const boxItem = await this.getLeitnerBoxItem(userId, vocabularyId);

        if (!boxItem) {
            throw new NotFoundException(
                `There is no such vocabulary with ID "${vocabularyId}" for the user "${userId}"`,
            );
        }

        const nextBox = LeitnerBoxType[`BOX_${boxItem.currentBox + 1}`];

        await this.leitnerSystemsRepository.update(
            { id: boxItem.id },
            LeitnerSystems.create(nextBox, userId, vocabularyId, true),
        );
    }

    async moveBackward(userId: string, cohortId: string, vocabularyId: string): Promise<void> {
        if (!(await this.vocabularyRepository.isVocabularyExist(vocabularyId, cohortId))) {
            throw new NotFoundException(`There is no such vocabulary with ID "${vocabularyId}"`);
        }

        const boxItem = await this.getLeitnerBoxItem(userId, vocabularyId);

        if (!boxItem) {
            throw new NotFoundException(
                `There is no such vocabulary with ID "${vocabularyId}" for the user "${userId}"`,
            );
        }

        const previousBox = LeitnerBoxType[`BOX_${boxItem.currentBox - 1}`];

        await this.leitnerSystemsRepository.update(
            { id: boxItem.id },
            LeitnerSystems.create(previousBox, userId, vocabularyId, false),
        );
    }

    private async getLeitnerBoxItem(userId: string, vocabularyId: string): Promise<LeitnerSystems> {
        return this.leitnerSystemsRepository.findOne({ userId, vocabularyId });
    }

    async getLeitnerBoxItemByVocabularyId(vocabularyId: string): Promise<LeitnerSystems> {
        return this.leitnerSystemsRepository.findOne({ vocabularyId });
    }

    async getBoxItems(
        userId: string,
        box: LeitnerBoxType,
        pagination: Pagination,
    ): Promise<SearchResult<LeitnerBoxItem>> {
        const { results, total } = await this.leitnerSystemsRepository.getBoxItems(userId, box, pagination);
        if (!total) {
            return new SearchResult<LeitnerBoxItem>([], total);
        }
        const vocabularies: Record<string, Pick<Vocabulary, 'id' | 'word'>[]> = _.groupBy(
            await this.vocabularyRepository.findWords(_.map(results, 'vocabularyId')),
            ({ id }) => id,
        );
        const items = _.map(results, (result) => {
            return {
                vocabularyId: result.vocabularyId,
                word: vocabularies[result.vocabularyId][0].word,
            };
        });
        return new SearchResult<LeitnerBoxItem>(items, total);
    }
}
