import { Injectable, NotFoundException } from '@nestjs/common';
import { Instructor } from './entities/instructor.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class InstructorService {
  constructor(
    @InjectRepository(Instructor)
    private instructorRepository: Repository<Instructor>,
  ) {}
  async getOne(userid: string): Promise<Instructor | undefined> {
    try {
      const instructor = await this.instructorRepository.findOne({
        where: { userid: userid },
      });
      if (!instructor) {
        throw new NotFoundException('Instructor not found');
      }
      return instructor;
    } catch (error) {
      console.error('Error finding instructor:', error);

      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new Error('Database error occurred while finding instructor');
      }
    }
  }
}
