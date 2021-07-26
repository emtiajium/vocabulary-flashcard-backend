import LeitnerSystemsRepository from '@/vocabulary/repositories/LeitnerSystemsRepository';
import { Injectable } from '@nestjs/common';

@Injectable()
export default class LeitnerSystemsService {
    constructor(private readonly leitnerSystemsRepository: LeitnerSystemsRepository) {}
}
