import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import User from '@/user/domains/User';
import BaseEntityWithMandatoryId from '@/common/persistence/BaseEntityWithMandatoryId';

@Entity('AuthSession')
export default class AuthSession extends BaseEntityWithMandatoryId {
    @ManyToOne(() => User, (user) => user.authSessions, { eager: false })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'uuid', nullable: false })
    userId: string;

    @Column({ type: 'text', nullable: false, unique: true })
    refreshTokenHash: string;

    @Column({ type: 'timestamp with time zone', nullable: false })
    expiresAt: Date;

    @Column({ type: 'timestamp with time zone', nullable: true })
    revokedAt: Date;

    @Column({ type: 'timestamp with time zone', nullable: true })
    lastUsedAt: Date;
}
