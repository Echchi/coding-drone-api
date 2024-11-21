import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Lecture } from '../../lecture/entities/lecture.entitiy';

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
