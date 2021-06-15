import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import BaseEntity from '@/common/domains/BaseEntity';
import {
    IsArray,
    IsBoolean,
    IsDefined,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import Definition from '@/vocabulary/domains/Definition';
import { plainToClass, Type } from 'class-transformer';
import Cohort from '@/user/domains/Cohort';
import * as _ from 'lodash';

@Entity('Vocabulary')
export default class Vocabulary extends BaseEntity {
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
    @Type(() => Definition)
    definitions?: Definition[];

    @ManyToOne(() => Cohort, (cohort) => cohort.id, { eager: false, cascade: false })
    @IsOptional()
    @Type(() => Cohort)
    cohort?: Cohort;

    @Column({ type: 'uuid', nullable: false })
    @IsUUID()
    @IsNotEmpty()
    cohortId: string;

    static populateMeanings(vocabulary: Vocabulary): Vocabulary {
        const vocabularyInstance = plainToClass(Vocabulary, vocabulary);
        vocabularyInstance.definitions = _.isEmpty(vocabulary.definitions)
            ? [Definition.create(vocabulary.id)]
            : vocabulary.definitions.map((definition) => Definition.create(vocabulary.id, definition));
        return vocabularyInstance;
    }
}
