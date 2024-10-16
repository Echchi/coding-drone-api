import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Lectures } from '../lectures/lectures.entity';

@Entity()
export class Students {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joined_at: Date;

  @ManyToOne(() => Lectures, (lectures) => lectures.id)
  lecture: Lectures;
}
