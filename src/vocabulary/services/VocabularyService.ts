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
import LeitnerSystemsService from '@/vocabulary/services/LeitnerSystemsService';
import User from '@/user/domains/User';

@Injectable()
export default class VocabularyService {
    constructor(
        private readonly vocabularyRepository: VocabularyRepository,
        private readonly definitionRepository: DefinitionRepository,
        private readonly leitnerSystemsService: LeitnerSystemsService,
    ) {}

    async createVocabulary(vocabulary: Vocabulary, userId: string, cohortId: string): Promise<Vocabulary> {
        const existingVocabulary = await this.findVocabularyById(vocabulary.id, userId);
        if (existingVocabulary) {
            // why do I have to manually remove?
            // Instead of removing why TypeORM tries to set vocabularyId to null?
            await this.removeOrphanDefinitions(existingVocabulary, vocabulary);
        }
        const vocabularyInstance = Vocabulary.populateDefinitions(vocabulary);
        vocabularyInstance.cohortId = cohortId;
        const newVocabulary = await this.vocabularyRepository.save(vocabularyInstance);
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

    findVocabularyById(id: string, userId: string): Promise<Vocabulary> {
        return this.vocabularyRepository.findVocabularyById(id, userId);
    }

    private extractDefinitionIds = (definitions: Definition[]): string[] => {
        return _.map(definitions, 'id');
    };

    async assertExistenceAndRemoveVocabularyAndDefinitions(
        id: string,
        userId: string,
        cohortId: string,
    ): Promise<void> {
        // TODO Just remove and check the delete response to throw the error
        // I mean, rely on the SQL provides feature
        const existingVocabulary = await this.findVocabularyById(id, userId);
        if (existingVocabulary && existingVocabulary.cohortId === cohortId) {
            await this.removeVocabularyAndDefinitions(existingVocabulary);
        } else if (existingVocabulary && existingVocabulary.cohortId !== cohortId) {
            throw new ForbiddenException();
        } else {
            throw new NotFoundException(`Vocabulary with ID "${id}" does not exist`);
        }
    }

    async assertExistenceIntoLeitnerSystems(id: string): Promise<void> {
        // TODO introduce foreign key at the LeitnerSystems table ...
        const leitnerItem = await this.leitnerSystemsService.getLeitnerBoxItemByVocabularyId(id);
        if (leitnerItem) {
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

    async removeVocabularyAndDefinitions(vocabulary: Vocabulary): Promise<void> {
        // TODO apply CASCADE
        if (!_.isEmpty(vocabulary.definitions)) {
            await this.definitionRepository.removeDefinitionsByIds(this.extractDefinitionIds(vocabulary.definitions));
        }
        await this.vocabularyRepository.removeVocabularyById(vocabulary.id);
    }

    async removeVocabularyById(id: string, requestedUser: User): Promise<void> {
        const { id: userId, cohortId } = requestedUser;
        await this.assertExistenceIntoLeitnerSystems(id);
        await this.assertExistenceAndRemoveVocabularyAndDefinitions(id, userId, cohortId);
    }

    async createInitialVocabularies(cohortId: string): Promise<SearchResult<Vocabulary>> {
        if (await this.vocabularyRepository.getSingleVocabularyByCohortId(cohortId)) {
            throw new ConflictException(`Cohort with ID: "${cohortId}" has at least one vocabulary`);
        }
        const payload = createVocabularies(cohortId, newJoinerVocabularyList);
        const vocabularies = await this.vocabularyRepository.save(payload);
        return new SearchResult<Vocabulary>(vocabularies, vocabularies.length);
    }
}
