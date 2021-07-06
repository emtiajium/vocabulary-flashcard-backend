import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
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
import { plainToClass, Type } from 'class-transformer';
import Cohort from '@/user/domains/Cohort';
import * as _ from 'lodash';
import BaseEntityWithMandatoryId from '@/common/domains/BaseEntityWithMandatoryId';

@Entity('Vocabulary')
export default class Vocabulary extends BaseEntityWithMandatoryId {
    @Column({ type: 'varchar' })
    @IsNotEmpty()
    @IsString()
    @IsDefined()
    word: string;

    @Column({ type: 'varchar', array: true, default: [] })
    @IsArray()
    @IsOptional()
    genericNotes?: string[];

    @Column({ type: 'varchar', array: true, default: [] })
    @ValidateIf((vocabulary) => !!vocabulary.genericExternalLinks)
    @IsUrl(undefined, { each: true })
    @IsArray()
    @IsOptional()
    genericExternalLinks?: string[];

    @Column({ type: 'varchar', array: true, default: [] })
    @IsArray()
    @IsOptional()
    linkerWords?: string[];

    @Column({ type: 'boolean' })
    @IsBoolean()
    isDraft: boolean;

    @OneToMany(() => Definition, (definition) => definition.id, { eager: true, cascade: true })
    @ValidateIf((vocabulary) => vocabulary.isDraft === false)
    @ValidateNested({ each: true })
    @ArrayNotEmpty()
    @IsArray()
    @Type(() => Definition)
    definitions?: Definition[];

    @ManyToOne(() => Cohort, (cohort) => cohort.id, { eager: false, cascade: false })
    @IsOptional()
    @Type(() => Cohort)
    cohort?: Cohort;

    @Column({ type: 'uuid', nullable: false })
    @IsUUID()
    @IsOptional()
    cohortId?: string;

    setCohortId?(cohortId: string): void {
        this.cohortId = cohortId;
    }

    static populateMeanings(vocabulary: Vocabulary): Vocabulary {
        const vocabularyInstance = plainToClass(Vocabulary, vocabulary);
        if (!_.isEmpty(vocabulary.definitions)) {
            vocabularyInstance.definitions = vocabulary.definitions.map((definition) =>
                Definition.create(vocabulary.id, definition),
            );
        }
        return vocabularyInstance;
    }
}
