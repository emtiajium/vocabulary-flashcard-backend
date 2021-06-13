import { EntityRepository, Repository } from 'typeorm';
import Vocabulary from '@/vocabulary/domains/Vocabulary';

@EntityRepository(Vocabulary)
export default class VocabularyRepository extends Repository<Vocabulary> {}
