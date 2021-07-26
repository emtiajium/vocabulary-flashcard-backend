import { EntityRepository, Repository } from 'typeorm';
import LeitnerSystems from '@/vocabulary/domains/LeitnerSystems';

@EntityRepository(LeitnerSystems)
export default class LeitnerSystemsRepository extends Repository<LeitnerSystems> {}
