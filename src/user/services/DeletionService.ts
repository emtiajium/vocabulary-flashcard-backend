import { Injectable } from '@nestjs/common';
import CohortRepository from '@/user/repositories/CohortRepository';
import VocabularyRepository from '@/vocabulary/repositories/VocabularyRepository';
import DefinitionRepository from '@/vocabulary/repositories/DefinitionRepository';
import LeitnerSystemsRepository from '@/vocabulary/repositories/LeitnerSystemsRepository';
import UserRepository from '@/user/repositories/UserRepository';
import CacheUserService from '@/user/services/CacheUserService';

@Injectable()
export default class DeletionService {
    // eslint-disable-next-line max-params
    constructor(
        private readonly cohortRepository: CohortRepository,
        private readonly userRepository: UserRepository,
        private readonly vocabularyRepository: VocabularyRepository,
        private readonly definitionRepository: DefinitionRepository,
        private readonly leitnerSystemsRepository: LeitnerSystemsRepository,
        private readonly cacheUserService: CacheUserService,
    ) {}

    async deleteData(userId: string, cohortId: string): Promise<void> {
        const isCohortAlone = await this.cohortRepository.isCohortAlone(cohortId);
        if (isCohortAlone) {
            await this.definitionRepository.removeDefinitionsByCohortId(cohortId);
        }
        await this.leitnerSystemsRepository.removeByUserId(userId);
        if (isCohortAlone) {
            await this.vocabularyRepository.removeVocabulariesByCohortId(cohortId);
        }
        this.cacheUserService.delete((await this.userRepository.findOneBy({ id: userId })).username);
        await this.userRepository.removeById(userId);
        if (isCohortAlone) {
            await this.cohortRepository.removeById(cohortId);
        }
    }
}
