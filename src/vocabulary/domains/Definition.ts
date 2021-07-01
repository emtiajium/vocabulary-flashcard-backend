import BaseEntity from '@/common/domains/BaseEntity';
import { Column, Entity, ManyToOne } from 'typeorm';
import {
    ArrayNotEmpty,
    IsArray,
    IsDefined,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    ValidateIf,
} from 'class-validator';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import { Type } from 'class-transformer';
import { v4 as uuidV4 } from 'uuid';
import IsArrayContainsOnlyUrl from '@/common/validators/IsArrayContainsOnlyUrl';

@Entity('Definition')
export default class Definition extends BaseEntity {
    @Column({ type: 'varchar', default: '' })
    @IsNotEmpty()
    @IsString()
    @IsDefined()
    meaning: string;

    @Column({ type: 'varchar', array: true, default: [] })
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
    @IsArrayContainsOnlyUrl()
    @IsArray()
    @IsOptional()
    externalLinks?: string[];

    @Type(() => Vocabulary)
    @ManyToOne(() => Vocabulary, (vocabulary) => vocabulary.id, { eager: false, cascade: true })
    vocabulary?: Vocabulary;

    @Column({ type: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    vocabularyId: string;

    // eslint-disable-next-line complexity
    static create(vocabularyId: string, definition?: Definition): Definition {
        const definitionInstance = new Definition();
        definitionInstance.id = definition?.id || uuidV4();
        definitionInstance.vocabularyId = vocabularyId;
        definitionInstance.meaning = definition?.meaning || '';
        definitionInstance.examples = definition?.examples || [];
        definitionInstance.notes = definition?.notes || [];
        definitionInstance.externalLinks = definition?.externalLinks || [];
        return definitionInstance;
    }
}
