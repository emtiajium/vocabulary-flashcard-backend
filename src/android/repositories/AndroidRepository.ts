import { DataSource, Repository } from 'typeorm';
import Android from '@/android/domains/Android';
import { Injectable } from '@nestjs/common';

@Injectable()
export default class AndroidRepository extends Repository<Android> {
    constructor(private dataSource: DataSource) {
        super(Android, dataSource.createEntityManager());
    }
}
