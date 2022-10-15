import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import BaseEntity from '@/common/persistence/BaseEntity';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import MomentUnit, { makeItNewer } from '@/common/utils/moment-util';
import LeitnerBoxAppearanceDifference from '@/vocabulary/domains/LeitnerBoxAppearanceDifference';
import User from '@/user/domains/User';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import { Expose } from 'class-transformer';

@Entity('LeitnerSystems')
@Unique('UQ_LeitnerSystems_userId_vocabularyId', ['user', 'vocabulary'])
export default class LeitnerSystems extends BaseEntity {
    @ManyToOne(() => User, (user) => user.flashcards, {
        nullable: false,
        eager: false,
        cascade: false,
    })
    user: User;

    @ManyToOne(() => Vocabulary, (vocabulary) => vocabulary.flashcards, {
        nullable: false,
        eager: false,
        cascade: false,
    })
    vocabulary: Vocabulary;

    @Column({ type: 'varchar', nullable: false })
    currentBox: LeitnerBoxType;

    @Column({ type: 'timestamp with time zone', nullable: false })
    boxAppearanceDate: Date;

    @Expose()
    get userId(): string {
        return this.user.id;
    }

    @Expose()
    get vocabularyId(): string {
        return this.vocabulary.id;
    }

    static calculateNextBoxAppearanceDate(box: LeitnerBoxType): Date {
        let boxAppearanceDate: Date;
        switch (box) {
            case LeitnerBoxType.BOX_1: {
                boxAppearanceDate = new Date();
                break;
            }
            case LeitnerBoxType.BOX_2: {
                boxAppearanceDate = makeItNewer(new Date(), MomentUnit.DAYS, LeitnerBoxAppearanceDifference.BOX_2);
                break;
            }
            case LeitnerBoxType.BOX_3: {
                boxAppearanceDate = makeItNewer(new Date(), MomentUnit.DAYS, LeitnerBoxAppearanceDifference.BOX_3);
                break;
            }
            case LeitnerBoxType.BOX_4: {
                boxAppearanceDate = makeItNewer(new Date(), MomentUnit.DAYS, LeitnerBoxAppearanceDifference.BOX_4);
                break;
            }
            default: {
                // LeitnerBoxType.BOX_5
                boxAppearanceDate = new Date();
            }
        }
        return boxAppearanceDate;
    }

    static calculatePreviousBoxAppearanceDate(): Date {
        return new Date();
    }

    static create(box: LeitnerBoxType, userId: string, vocabularyId: string, isForward: boolean): LeitnerSystems {
        const leitnerSystems = new LeitnerSystems();
        leitnerSystems.user = { id: userId } as User;
        leitnerSystems.vocabulary = { id: vocabularyId } as Vocabulary;
        leitnerSystems.currentBox = box;
        leitnerSystems.boxAppearanceDate = isForward
            ? LeitnerSystems.calculateNextBoxAppearanceDate(box)
            : LeitnerSystems.calculatePreviousBoxAppearanceDate();
        return leitnerSystems;
    }

    setId?(id: string): LeitnerSystems {
        this.id = id;
        return this;
    }
}
