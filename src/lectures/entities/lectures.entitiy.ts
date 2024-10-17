import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Instructor } from '../../instructor/entities/instructor.entity';

@Entity()
export class Lectures {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @ManyToOne(() => Instructor, (instructor) => instructor.id)
  instructor: Instructor;
}
