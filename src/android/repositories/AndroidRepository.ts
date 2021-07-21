import { EntityRepository, Repository } from 'typeorm';
import Android from '@/android/domains/Android';

@EntityRepository(Android)
export default class AndroidRepository extends Repository<Android> {}
