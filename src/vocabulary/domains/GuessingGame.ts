import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('GuessingGame')
export default class GuessingGame {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: false })
    definitionId: string;

    @Column({ type: 'uuid', nullable: false })
    userId: string;

    @Column({ type: 'varchar', nullable: false })
    meaning: string;

    @Column({ type: 'varchar', nullable: false })
    word: string;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date;
}
