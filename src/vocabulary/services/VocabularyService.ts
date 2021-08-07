import VocabularyRepository from '@/vocabulary/repositories/VocabularyRepository';
import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import DefinitionRepository from '@/vocabulary/repositories/DefinitionRepository';
import * as _ from 'lodash';
import VocabularySearch from '@/vocabulary/domains/VocabularySearch';
import SearchResult from '@/common/domains/SearchResult';
import Definition from '@/vocabulary/domains/Definition';
import { createVocabularies } from '@/vocabulary/domains/PartialVocabulary';
import newJoinerVocabularyList from '@/manual-scripts/new-joiner-vocabulary-list';
import LeitnerSystemsService from '@/vocabulary/services/LeitnerSystemsService';

@Injectable()
export default class VocabularyService {
    constructor(
        private readonly vocabularyRepository: VocabularyRepository,
        private readonly definitionRepository: DefinitionRepository,
        private readonly leitnerSystemsService: LeitnerSystemsService,
    ) {}

    async createVocabulary(vocabulary: Vocabulary, userId: string, cohortId: string): Promise<Vocabulary> {
        const existingVocabulary = await this.findVocabularyById(vocabulary.id, userId);
        const vocabularyInstance = Vocabulary.populateDefinitions(vocabulary);
        vocabularyInstance.cohortId = cohortId;
        const newVocabulary = await this.vocabularyRepository.save(vocabularyInstance);
        newVocabulary.isInLeitnerBox = !!existingVocabulary?.isInLeitnerBox;
        return newVocabulary;
    }

    async findVocabularies(
        userId: string,
        cohortId: string,
        vocabularySearch: VocabularySearch,
    ): Promise<SearchResult<Vocabulary>> {
        return this.vocabularyRepository.findVocabularies(userId, cohortId, vocabularySearch);
    }

    async findVocabularyById(id: string, userId: string): Promise<Vocabulary> {
        return this.vocabularyRepository.findVocabularyById(id, userId);
    }

    private extractDefinitionIds = (definitions: Definition[]): string[] => {
        return _.map(definitions, 'id');
    };

    async assertExistenceAndRemoveVocabularyAndDefinitions(id: string, userId: string): Promise<void> {
        const existingVocabulary = await this.findVocabularyById(id, userId);
        if (existingVocabulary) {
            await this.removeVocabularyAndDefinitions(existingVocabulary);
        } else {
            throw new NotFoundException(`Vocabulary with ID "${id}" does not exist`);
        }
    }

    async assertExistenceIntoLeitnerSystems(id: string): Promise<void> {
        const leitnerItem = await this.leitnerSystemsService.getLeitnerBoxItemByVocabularyId(id);
        if (leitnerItem) {
            throw new UnprocessableEntityException(
                `This vocabulary cannot be removed as one of the members of your cohort put this into a Leitner box.`,
            );
        }
    }

    async removeVocabularyAndDefinitions(vocabulary: Vocabulary): Promise<void> {
        if (!_.isEmpty(vocabulary.definitions)) {
            await this.definitionRepository.removeDefinitionsByIds(this.extractDefinitionIds(vocabulary.definitions));
        }
        await this.vocabularyRepository.removeVocabularyById(vocabulary.id);
    }

    async removeVocabularyById(id: string, userId: string): Promise<void> {
        await this.assertExistenceIntoLeitnerSystems(id);
        await this.assertExistenceAndRemoveVocabularyAndDefinitions(id, userId);
    }

    async createInitialVocabularies(cohortId: string): Promise<SearchResult<Vocabulary>> {
        if (await this.vocabularyRepository.getSingleVocabularyByCohortId(cohortId)) {
            throw new ConflictException(`Cohort with ID: "${cohortId}" has at least one vocabulary`);
        }
        const payload = createVocabularies(cohortId, newJoinerVocabularyList);
        const vocabularies = await Promise.all(
            _.map(payload, (vocabulary) => this.vocabularyRepository.save(vocabulary)),
        );
        return new SearchResult<Vocabulary>(vocabularies, vocabularies.length);
    }
}
