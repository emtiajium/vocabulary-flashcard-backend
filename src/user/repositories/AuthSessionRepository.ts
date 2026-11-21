import { DataSource, Repository } from 'typeorm';
import AuthSession from '@/user/domains/AuthSession';
import { Injectable } from '@nestjs/common';

@Injectable()
export default class AuthSessionRepository extends Repository<AuthSession> {
    constructor(private dataSource: DataSource) {
        super(AuthSession, dataSource.createEntityManager());
    }
}
