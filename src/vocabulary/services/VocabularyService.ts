import VocabularyRepository from '@/vocabulary/repositories/VocabularyRepository';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import DefinitionRepository from '@/vocabulary/repositories/DefinitionRepository';
import * as _ from 'lodash';
import VocabularySearch from '@/vocabulary/domains/VocabularySearch';
import SearchResult from '@/common/domains/SearchResult';
import Definition from '@/vocabulary/domains/Definition';
import { createVocabularies } from '@/vocabulary/domains/CustomVocabulary';
import VocabularyList from '@/manual-scripts/VocabularyList';

@Injectable()
export default class VocabularyService {
    constructor(
        private readonly vocabularyRepository: VocabularyRepository,
        private readonly definitionRepository: DefinitionRepository,
    ) {}

    async createVocabulary(vocabulary: Vocabulary, cohortId: string): Promise<Vocabulary> {
        const existingVocabulary = await this.findVocabularyById(vocabulary.id);
        if (existingVocabulary) {
            // this is a workaround
            // facing issues during "UPDATE"
            await this.removeVocabularyAndDefinitions(existingVocabulary);
        }
        const vocabularyInstance = Vocabulary.populateMeanings(vocabulary);
        // TODO investigate why vocabularyInstance.setCohortId(cohortId) is not working
        vocabularyInstance.cohortId = cohortId;
        return this.vocabularyRepository.save(vocabularyInstance);
    }

    async findVocabularies(cohortId: string, vocabularySearch: VocabularySearch): Promise<SearchResult<Vocabulary>> {
        return this.vocabularyRepository.findVocabularies(cohortId, vocabularySearch);
    }

    async findVocabularyById(id: string): Promise<Vocabulary> {
        return this.vocabularyRepository.findVocabularyById(id);
    }

    private extractDefinitionIds = (definitions: Definition[]): string[] => {
        return _.map(definitions, 'id');
    };

    async assertExistenceAndRemoveVocabularyAndDefinitions(id: string): Promise<void> {
        const existingVocabulary = await this.findVocabularyById(id);
        if (existingVocabulary) {
            await this.removeVocabularyAndDefinitions(existingVocabulary);
        } else {
            throw new NotFoundException(`Vocabulary with ID "${id}" does not exist`);
        }
    }

    async removeVocabularyAndDefinitions(vocabulary: Vocabulary): Promise<void> {
        if (!_.isEmpty(vocabulary.definitions)) {
            await this.definitionRepository.removeDefinitionsByIds(this.extractDefinitionIds(vocabulary.definitions));
        }
        await this.vocabularyRepository.removeVocabularyById(vocabulary.id);
    }

    async removeVocabularyById(id: string): Promise<void> {
        await this.assertExistenceAndRemoveVocabularyAndDefinitions(id);
    }

    private generateVocabularyPayload = (cohortId: string): Vocabulary[] => {
        const sampleVocabularies = 20;
        return createVocabularies(cohortId, VocabularyList.slice(0, sampleVocabularies));
    };

    async createInitialVocabularies(cohortId: string): Promise<SearchResult<Vocabulary>> {
        if (await this.vocabularyRepository.getSingleVocabularyByCohortId(cohortId)) {
            throw new ConflictException(`Cohort with ID: "${cohortId}" has at least one vocabulary`);
        }
        const payload = this.generateVocabularyPayload(cohortId);
        const vocabularies = await Promise.all(
            _.map(payload, (vocabulary) => this.vocabularyRepository.save(vocabulary)),
        );
        return new SearchResult<Vocabulary>(vocabularies, vocabularies.length);
    }
}
