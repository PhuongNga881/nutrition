import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import 'dotenv/config';
import { Conditions } from 'src/entity/Conditions';
import {
  ConditionFilterDTO,
  ConditionUpdateDTO,
} from 'src/condition/dto/condition.dto';
@Injectable()
export class ConditionsService {
  constructor(
    @InjectRepository(Conditions)
    private conditionRepository: Repository<Conditions>,
  ) {}

  async findOne(id: number) {
    const ingredient = await this.conditionRepository
      .createQueryBuilder('i')
      .where('i.id = :id', { id: id })
      .getOne();
    if (!ingredient)
      throw new HttpException('does not exists', HttpStatus.BAD_REQUEST);
    return ingredient;
  }
  async findAll(input: ConditionFilterDTO) {
    const { name, isActive } = input;
    return await this.conditionRepository
      .createQueryBuilder('i')
      .where(
        `1=1
        ${name ? 'AND LOWER(i.name) LIKE :name' : ''}
        ${isActive?.toString() === 'true' || isActive?.toString() === 'false' ? ' and i.isActive = :isActive' : ''}`,
        {
          ...(name ? { name: `%${name.toLowerCase()}%` } : {}),
          ...(isActive?.toString() === 'true' ||
          isActive?.toString() === 'false'
            ? { isActive: isActive?.toString() === 'true' ? 1 : 0 }
            : {}),
        },
      )
      .getMany();
  }
  // async createOne(input: ConditionCreateDTO) {
  //   return await this.conditionRepository.save(
  //     this.conditionRepository.create({
  //       ...input,
  //     }),
  //   );
  // }
  async update(id: number, input: ConditionUpdateDTO) {
    const { isActive } = input;
    const condition = await this.conditionRepository.findOne({
      where: { id },
    });
    if (!condition)
      throw new HttpException('does not exists', HttpStatus.BAD_REQUEST);
    return await this.conditionRepository.save({
      ...condition,
      isActive,
    });
  }
  // async delete(input: ConditionDeleteDTO) {
  //   const { id: ids } = input;
  //   if (ids?.length > 0) {
  //     await this.conditionRepository.delete(ids);
  //     return new HttpException('deleted', HttpStatus.GONE);
  //   }
  // }
}
