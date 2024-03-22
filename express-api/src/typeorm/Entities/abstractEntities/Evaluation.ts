import { EvaluationKey } from '@/typeorm/Entities/EvaluationKey';
import { BaseEntity } from '@/typeorm/Entities/abstractEntities/BaseEntity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity()
export class Evaluation extends BaseEntity {
  @PrimaryColumn({ name: 'year', type: 'int' })
  Year: number;

  @PrimaryColumn({ name: 'evaluation_key_id', type: 'int' })
  EvaluationKeyId: number;

  @ManyToOne(() => EvaluationKey, (EvaluationKey) => EvaluationKey.Id)
  @JoinColumn({ name: 'evaluation_key_id' })
  EvaluationKey: EvaluationKey;

  @Column({ type: 'money' })
  Value: number;

  @Column({ type: 'character varying', length: 500, nullable: true })
  Note: string;
}
