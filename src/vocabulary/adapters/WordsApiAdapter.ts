import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { ObjectLiteral } from '@/common/types/ObjectLiteral';
import { Injectable, Logger } from '@nestjs/common';
import { RandomlyChosenMeaningResponse } from '@/vocabulary/domains/RandomlyChosenMeaningResponse';
import { ConfigService } from '@nestjs/config';
import { shuffle, times } from 'lodash';
import safeStringify from 'fast-safe-stringify';
import { getRandomArrayItem } from '@/common/utils/array-util';

@Injectable()
export default class WordsApiAdapter {
    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly logger: Logger,
    ) {}

    async getRandomWords(): Promise<RandomlyChosenMeaningResponse[]> {
        if (this.configService.get('WORDS_API_ENABLED') !== 'true') {
            return [];
        }

        const randomlyChosenMeaningResponses: RandomlyChosenMeaningResponse[] = [];
        const numberOfRandomWords = 10;
        await Promise.all(
            times(numberOfRandomWords).map(async () => {
                randomlyChosenMeaningResponses.push(...(await this.getRandomWord()));
            }),
        );
        return shuffle(randomlyChosenMeaningResponses);
    }

    private async getRandomWord(): Promise<RandomlyChosenMeaningResponse[]> {
        try {
            const response = await this.get<ObjectLiteral, ObjectLiteral>(`https://wordsapiv1.p.rapidapi.com/words`, {
                params: {
                    random: 'true',
                    partOfSpeech: getRandomArrayItem<string>(['verb', 'adjective']),
                    hasDetails: 'definitions',
                },
                headers: {
                    'X-RapidAPI-Key': this.configService.get<string>('WORDS_API_AUTH_KEY'),
                    'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com',
                },
            });

            return response.results.map((result) => {
                return <RandomlyChosenMeaningResponse>{
                    meaning: result.definition,
                    word: response.word,
                };
            });
        } catch (error) {
            this.logger.error(`Error while making API request to "wordsapi". Details: ${safeStringify(error)}`);
            return [];
        }
    }

    private async get<UOptions, VResponse>(url: string, options?: UOptions): Promise<VResponse> {
        const response: AxiosResponse<VResponse> = await this.httpService.get(url, options).toPromise();
        return response.data;
    }
}
