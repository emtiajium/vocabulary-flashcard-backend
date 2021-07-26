import { Controller } from '@nestjs/common';
import LeitnerSystemsService from '@/vocabulary/services/LeitnerSystemsService';

@Controller('/v1/leitner-systems')
export default class LeitnerSystemsController {
    constructor(private readonly leitnerSystemsService: LeitnerSystemsService) {}
}
