import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { InstructorService } from './instructor.service';

@Controller('instructor')
export class InstructorController {
  constructor(private readonly instructorService: InstructorService) {}

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const instructor = await this.instructorService.getOne(id);
    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }
    return instructor;
  }
}
