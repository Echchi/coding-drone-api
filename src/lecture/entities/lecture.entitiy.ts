import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Instructor } from '../../instructor/entities/instructor.entity';
import { JoinColumn } from 'typeorm';

@Entity()
export class Lecture {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @ManyToOne(() => Instructor, (instructor) => instructor.id)
  @JoinColumn({ name: 'instructorId' })
  instructor: Instructor;

  @Column()
  instructorId: number;
}
