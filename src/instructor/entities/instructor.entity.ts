import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Instructor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  userid: string;

  @Column()
  password: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
