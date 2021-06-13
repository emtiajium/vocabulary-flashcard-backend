import { EntityRepository, Repository } from 'typeorm';
import Meaning from '@/vocabulary/domains/Meaning';

@EntityRepository(Meaning)
export default class MeaningRepository extends Repository<Meaning> {}
