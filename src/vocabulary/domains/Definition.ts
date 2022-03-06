import { Column, Entity, ManyToOne } from 'typeorm';
import {
    ArrayNotEmpty,
    IsArray,
    IsDefined,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    IsUUID,
    ValidateIf,
} from 'class-validator';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import { Type } from 'class-transformer';
import { ApiHideProperty } from '@nestjs/swagger';
import BaseEntityWithMandatoryId from '@/common/domains/BaseEntityWithMandatoryId';

@Entity('Definition')
export default class Definition extends BaseEntityWithMandatoryId {
    @Column({ type: 'varchar', default: '' })
    @IsNotEmpty()
    @IsString()
    @IsDefined()
    meaning: string;

    @Column({ type: 'varchar', array: true, default: [] })
    @IsNotEmpty({ each: true })
    @ArrayNotEmpty()
    @IsArray()
    @IsDefined()
    examples?: string[];

    @Column({ type: 'varchar', array: true, default: [] })
    @IsArray()
    @IsOptional()
    notes?: string[];

    @Column({ type: 'varchar', array: true, default: [] })
    @ValidateIf((definition) => !!definition.externalLinks)
    @IsUrl(undefined, { each: true })
    @IsArray()
    @IsOptional()
    externalLinks?: string[];

    @ApiHideProperty()
    @Type(() => Vocabulary)
    @ManyToOne(() => Vocabulary, (vocabulary) => vocabulary.definitions, {
        eager: false,
        cascade: false,
        nullable: false,
        onDelete: 'CASCADE',
    })
    vocabulary?: Vocabulary;

    @Column({ type: 'uuid', nullable: false })
    @IsUUID()
    @IsNotEmpty()
    vocabularyId: string;

    // eslint-disable-next-line complexity
    static create(vocabularyId: string, definition?: Definition): Definition {
        const definitionInstance = new Definition();
        definitionInstance.id = definition.id;
        definitionInstance.vocabularyId = vocabularyId;
        definitionInstance.meaning = definition?.meaning || '';
        definitionInstance.examples = definition?.examples || [];
        definitionInstance.notes = definition?.notes || [];
        definitionInstance.externalLinks = definition?.externalLinks || [];
        return definitionInstance;
    }
}
