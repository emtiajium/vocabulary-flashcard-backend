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
import { plainToInstance, Transform, Type } from 'class-transformer';
import Cohort from '@/user/domains/Cohort';
import BaseEntityWithMandatoryId from '@/common/persistence/BaseEntityWithMandatoryId';
import { ApiHideProperty } from '@nestjs/swagger';
import LeitnerSystems from '@/vocabulary/domains/LeitnerSystems';
import { capitalize, isEmpty, map } from 'lodash';

@Entity('Vocabulary')
@Unique(['word', 'cohortId'])
export default class Vocabulary extends BaseEntityWithMandatoryId {
    @Column({ type: 'varchar' })
    @Transform(({ value }) => capitalize(value).trim())
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
    @Transform(({ value }) => map(value, (linkerWord) => capitalize(linkerWord)))
    @IsArray()
    @IsOptional()
    linkerWords?: string[];

    @Column({ type: 'boolean', default: true })
    @IsBoolean()
    isDraft: boolean;

    @OneToMany(() => Definition, (definition) => definition.vocabulary, { eager: false, cascade: true })
    @ValidateIf((vocabulary) => vocabulary.isDraft === false || !isEmpty(vocabulary.definitions))
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
        const vocabularyInstance = plainToInstance(Vocabulary, vocabulary);
        if (!isEmpty(vocabulary.definitions)) {
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
            const { id: _id, ...cohortWithoutId } = vocabulary.cohort;
            vocabulary.cohort = cohortWithoutId as Cohort;
        }

        return vocabulary;
    }
}
