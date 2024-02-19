import VocabularyRepository from '@/vocabulary/repositories/VocabularyRepository';
import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import DefinitionRepository from '@/vocabulary/repositories/DefinitionRepository';
import * as _ from 'lodash';
import VocabularySearchRequest from '@/vocabulary/domains/VocabularySearchRequest';
import SearchResult from '@/common/domains/SearchResult';
import Definition from '@/vocabulary/domains/Definition';
import { createVocabularies } from '@/vocabulary/domains/PartialVocabulary';
import getNewJoinerVocabularyList from '@/manual-scripts/new-joiner-vocabulary-list';
import User from '@/user/domains/User';
import VocabularySearchResponse from '@/vocabulary/domains/VocabularySearchResponse';
import * as uuid from 'uuid';

@Injectable()
export default class VocabularyService {
    constructor(
        private readonly vocabularyRepository: VocabularyRepository,
        private readonly definitionRepository: DefinitionRepository,
    ) {}

    async createVocabulary(vocabulary: Vocabulary, userId: string, cohortId: string): Promise<Vocabulary> {
        const existingVocabulary = await this.vocabularyRepository.findVocabularyById(vocabulary.id, userId);
        if (existingVocabulary) {
            this.validateCohort(existingVocabulary.cohortId, cohortId);
            // why do I have to manually remove?
            // Instead of removing why TypeORM tries to set vocabularyId to null?
            await this.removeOrphanDefinitions(existingVocabulary, vocabulary);
        }
        const vocabularyInstance = Vocabulary.populateDefinitions(vocabulary);
        vocabularyInstance.cohortId = cohortId;
        const newVocabulary = await this.vocabularyRepository.upsertII(vocabularyInstance);
        newVocabulary.isInLeitnerBox = Boolean(existingVocabulary?.isInLeitnerBox);
        this.relateLinkerWords(newVocabulary).finally();
        return Vocabulary.omitCohortId(newVocabulary);
    }

    private async relateLinkerWords(vocabulary: Vocabulary): Promise<void> {
        const { word, linkerWords, cohortId } = vocabulary;
        if (linkerWords?.length > 0) {
            const vocabularies = await this.vocabularyRepository.getLinkerWordsByWords(linkerWords, cohortId);
            await Promise.all(
                vocabularies.map((currentVocabulary) => {
                    if (!currentVocabulary.linkerWords.includes(word)) {
                        return this.vocabularyRepository.updateLinkerWords(currentVocabulary.id, [
                            ...currentVocabulary.linkerWords,
                            word,
                        ]);
                    }
                    return Promise.resolve();
                }),
            );
        }
    }

    findVocabularies(
        userId: string,
        cohortId: string,
        vocabularySearchRequest: VocabularySearchRequest,
    ): Promise<SearchResult<VocabularySearchResponse>> {
        return this.vocabularyRepository.findVocabularies(userId, cohortId, vocabularySearchRequest);
    }

    async findVocabularyById(id: string, userId: string): Promise<Vocabulary> {
        const vocabulary = await this.vocabularyRepository.findVocabularyById(id, userId);
        this.handleNotFound(id, vocabulary);
        return Vocabulary.omitCohortId(vocabulary);
    }

    async findVocabularyByWord(word: string, userId: string, cohortId: string): Promise<Vocabulary> {
        const id = await this.vocabularyRepository.getIdByWord(word, cohortId);
        if (!id) {
            this.handleNotFoundUsingWord(word);
        }
        const vocabulary = await this.vocabularyRepository.findVocabularyById(id, userId);
        return Vocabulary.omitCohortId(vocabulary);
    }

    private handleNotFound(id: string, vocabulary?: Vocabulary | Partial<Vocabulary>): void {
        if (!vocabulary) {
            throw new NotFoundException(`Vocabulary with ID "${id}" does not exist`);
        }
    }

    private handleNotFoundUsingWord(word: string, vocabulary?: Vocabulary | Partial<Vocabulary>): void {
        if (!vocabulary) {
            throw new NotFoundException(`Vocabulary with word "${word}" does not exist`);
        }
    }

    private extractDefinitionIds = (definitions: Definition[]): string[] => {
        return _.map(definitions, 'id');
    };

    private validateCohort(currentCohortId: string, requesterCohortId: string): void {
        if (currentCohortId !== requesterCohortId) {
            throw new ForbiddenException();
        }
    }

    private async validateForRemoval(id: string, cohortId: string): Promise<void> {
        const existingVocabulary = await this.vocabularyRepository.getPartialForRemoval(id);

        this.handleNotFound(id, existingVocabulary);
        this.validateCohort(existingVocabulary.cohortId, cohortId);
        if (existingVocabulary.isInLeitnerBox) {
            throw new UnprocessableEntityException(
                `This vocabulary cannot be removed as one of the members of your cohort made it a flashcard.`,
            );
        }
    }

    private async removeOrphanDefinitions(existingVocabulary: Vocabulary, vocabulary: Vocabulary): Promise<void> {
        await this.definitionRepository.removeDefinitionsByIds(
            _.difference(
                this.extractDefinitionIds(existingVocabulary.definitions),
                this.extractDefinitionIds(vocabulary.definitions),
            ),
        );
    }

    async removeVocabularyAndDefinitions(vocabularyId: string): Promise<void> {
        // TODO apply CASCADE
        await this.definitionRepository.removeDefinitionsByVocabularyId(vocabularyId);
        await this.vocabularyRepository.removeVocabularyById(vocabularyId);
    }

    async removeVocabularyById(id: string, requestedUser: User): Promise<void> {
        const { cohortId } = requestedUser;
        await this.validateForRemoval(id, cohortId);
        await this.removeVocabularyAndDefinitions(id);
    }

    async createInitialVocabularies(cohortId: string): Promise<SearchResult<Vocabulary>> {
        if (await this.vocabularyRepository.getSingleVocabularyByCohortId(cohortId)) {
            throw new ConflictException({
                name: 'ExistingVocabConflict',
                message: `Requested cohort has at least one vocabulary`,
            });
        }
        const payload = createVocabularies(cohortId, getNewJoinerVocabularyList());
        let vocabularies = await this.vocabularyRepository.save(payload);
        vocabularies = vocabularies.map((vocabulary) => Vocabulary.omitCohortId(vocabulary));
        return new SearchResult<Vocabulary>(vocabularies, vocabularies.length);
    }

    assertExistenceByWord(id: string, word: string, cohortId: string): Promise<Partial<Vocabulary> | undefined> {
        return this.vocabularyRepository.assertExistenceByWord(id, word, cohortId);
    }

    async updateCohort(currentCohortId: string, newCohortId: string): Promise<void> {
        const vocabularyIds = await this.vocabularyRepository.getIdsByCohortId(currentCohortId);

        await Promise.all(
            vocabularyIds.map(async (vocabularyId) => {
                try {
                    await this.vocabularyRepository.updateCohortId(vocabularyId, newCohortId);
                } catch (error) {
                    if (error.response?.name === 'WordConflict') {
                        await this.vocabularyRepository.updateWord(
                            vocabularyId,
                            `${
                                error.response.word
                            }---SUFFIX_ADDED_BY_SYSTEM_AS_IT_IS_DUPLICATED_WHICH_WAS_ADDED_BY_ANOTHER_MEMBER_OF_THE_COHORT---${uuid.v4()}`,
                        );
                        await this.vocabularyRepository.updateCohortId(vocabularyId, newCohortId);
                    } else {
                        throw error;
                    }
                }
            }),
        );
    }
}
