import { Column, Entity, ManyToOne, OneToMany, Unique } from 'typeorm';
import {
    ArrayNotEmpty,
    IsArray,
    IsBoolean,
    IsDefined,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    IsUUID,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import Definition from '@/vocabulary/domains/Definition';
import { plainToClass, Transform, Type } from 'class-transformer';
import Cohort from '@/user/domains/Cohort';
import * as _ from 'lodash';
import BaseEntityWithMandatoryId from '@/common/persistence/BaseEntityWithMandatoryId';
import { ApiHideProperty } from '@nestjs/swagger';
import LeitnerSystems from '@/vocabulary/domains/LeitnerSystems';

@Entity('Vocabulary')
@Unique(['word', 'cohortId'])
export default class Vocabulary extends BaseEntityWithMandatoryId {
    @Column({ type: 'varchar' })
    @Transform(({ value }) => _.capitalize(value).trim())
    @IsNotEmpty()
    @IsString()
    @IsDefined()
    word: string;

    @Column({ type: 'varchar', array: true, default: [] })
    @IsArray()
    @IsOptional()
    genericNotes?: string[];

    @Column({ type: 'varchar', array: true, default: [] })
    @ValidateIf((vocabulary) => Boolean(vocabulary.genericExternalLinks))
    @IsUrl(undefined, { each: true })
    @IsArray()
    @IsOptional()
    genericExternalLinks?: string[];

    @Column({ type: 'varchar', array: true, default: [] })
    @Transform(({ value }) => _.map(value, (linkerWord) => _.capitalize(linkerWord)))
    @IsArray()
    @IsOptional()
    linkerWords?: string[];

    @Column({ type: 'boolean', default: true })
    @IsBoolean()
    isDraft: boolean;

    @OneToMany(() => Definition, (definition) => definition.vocabulary, { eager: false, cascade: true })
    @ValidateIf((vocabulary) => vocabulary.isDraft === false || _.isEmpty(vocabulary.definitions) === false)
    @ValidateNested({ each: true })
    @ArrayNotEmpty()
    @IsArray()
    @Type(() => Definition)
    definitions?: Definition[];

    @ApiHideProperty()
    @ManyToOne(() => Cohort, (cohort) => cohort.vocabularies, { eager: false, cascade: false })
    @IsOptional()
    @Type(() => Cohort)
    cohort?: Cohort;

    @ApiHideProperty()
    @Column({ type: 'uuid', nullable: false })
    @IsUUID()
    @IsOptional()
    cohortId?: string;

    @ApiHideProperty()
    @IsOptional()
    @OneToMany(() => LeitnerSystems, (leitnerSystems) => leitnerSystems.vocabulary, {
        nullable: true,
        eager: false,
        cascade: false,
    })
    flashcards?: LeitnerSystems[];

    @ApiHideProperty()
    @IsOptional()
    isInLeitnerBox?: boolean;

    static populateDefinitions(vocabulary: Vocabulary): Vocabulary {
        const vocabularyInstance = plainToClass(Vocabulary, vocabulary);
        if (!_.isEmpty(vocabulary.definitions)) {
            vocabularyInstance.isDraft = false;
            vocabularyInstance.definitions = vocabulary.definitions.map((definition) =>
                Definition.create(vocabulary.id, definition),
            );
        }
        return vocabularyInstance;
    }

    static omitCohortId(vocabulary: Vocabulary): Vocabulary {
        if (vocabulary.cohortId) {
            delete vocabulary.cohortId;
        }
        if (vocabulary.cohort?.id) {
            delete vocabulary.cohort.id;
        }
        return vocabulary;
    }
}
