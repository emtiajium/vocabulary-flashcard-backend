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
import BaseEntityWithMandatoryId from '@/common/persistence/BaseEntityWithMandatoryId';

@Entity('Definition')
export default class Definition extends BaseEntityWithMandatoryId {
    @Column({ type: 'varchar', nullable: false })
    @IsNotEmpty()
    @IsString()
    @IsDefined()
    meaning: string;

    @Column({ type: 'varchar', array: true, nullable: false })
    @IsNotEmpty({ each: true })
    @ArrayNotEmpty()
    @IsArray()
    examples: string[];

    @Column({ type: 'varchar', array: true })
    @IsArray()
    @IsOptional()
    notes?: string[];

    @Column({ type: 'varchar', array: true })
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

    static create(vocabularyId: string, definition?: Definition): Definition {
        const definitionInstance = new Definition();
        definitionInstance.id = definition?.id;
        definitionInstance.vocabularyId = vocabularyId;
        definitionInstance.meaning = definition.meaning;
        definitionInstance.examples = definition.examples;
        definitionInstance.notes = definition?.notes || [];
        definitionInstance.externalLinks = definition?.externalLinks || [];
        return definitionInstance;
    }
}
