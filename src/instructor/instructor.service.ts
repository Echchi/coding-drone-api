import { Injectable } from '@nestjs/common';
import { Instructor } from './entities/instructor.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class InstructorService {
  constructor(
    @InjectRepository(Instructor)
    private instructorRepository: Repository<Instructor>,
  ) {}
  async findOne(userid: string): Promise<Instructor | undefined> {
    return this.instructorRepository.findOne({ where: { userid: userid } });
  }
}
