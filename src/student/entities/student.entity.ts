import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Lecture } from '../../lecture/entities/lecture.entitiy';

@Entity()
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joined_at: Date;

  @ManyToOne(() => Lecture, (lecture) => lecture.students, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lecture_id' })
  lecture: Lecture;
}
