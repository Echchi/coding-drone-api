import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Lecture } from '../../lectures/entities/lectures.entitiy';

@Entity()
export class Students {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joined_at: Date;

  @ManyToOne(() => Lecture, (lectures) => lectures.id)
  lecture: Lecture;
}
