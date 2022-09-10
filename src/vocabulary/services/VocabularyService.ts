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
import VocabularySearch from '@/vocabulary/domains/VocabularySearch';
import SearchResult from '@/common/domains/SearchResult';
import Definition from '@/vocabulary/domains/Definition';
import { createVocabularies } from '@/vocabulary/domains/PartialVocabulary';
import newJoinerVocabularyList from '@/manual-scripts/new-joiner-vocabulary-list';
import User from '@/user/domains/User';

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
        const newVocabulary = await this.vocabularyRepository.upsert(vocabularyInstance);
        newVocabulary.isInLeitnerBox = !!existingVocabulary?.isInLeitnerBox;
        return newVocabulary;
    }

    findVocabularies(
        userId: string,
        cohortId: string,
        vocabularySearch: VocabularySearch,
    ): Promise<SearchResult<Vocabulary>> {
        return this.vocabularyRepository.findVocabularies(userId, cohortId, vocabularySearch);
    }

    async findVocabularyById(id: string, userId: string): Promise<Vocabulary> {
        const vocabulary = await this.vocabularyRepository.findVocabularyById(id, userId);
        this.handleNotFound(id, vocabulary);
        return vocabulary;
    }

    private handleNotFound(id: string, vocabulary?: Vocabulary | Partial<Vocabulary>): void {
        if (!vocabulary) {
            throw new NotFoundException(`Vocabulary with ID "${id}" does not exist`);
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
            throw new ConflictException(`Cohort with ID: "${cohortId}" has at least one vocabulary`);
        }
        const payload = createVocabularies(cohortId, newJoinerVocabularyList);
        const vocabularies = await this.vocabularyRepository.save(payload);
        return new SearchResult<Vocabulary>(vocabularies, vocabularies.length);
    }

    assertExistenceByWord(word: string, cohortId: string): Promise<Partial<Vocabulary> | undefined> {
        return this.vocabularyRepository.getPartialByWord(word.trim(), cohortId);
    }
}
