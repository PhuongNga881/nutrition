import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import 'dotenv/config';
import { Conditions } from 'src/entity/Conditions';
import { ConditionFilterDTO } from 'src/condition/dto/condition.dto';
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
    const { name } = input;
    return await this.conditionRepository
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.userCondition', 'uc')
      .leftJoinAndSelect('uc.user', 'user')
      .where(`1=1 ${name ? 'AND LOWER(i.name) LIKE :name' : ''}`, {
        ...(name ? { name: `%${name.toLowerCase()}%` } : {}),
      })
      .getMany();
  }
  // async createOne(input: ConditionCreateDTO) {
  //   return await this.conditionRepository.save(
  //     this.conditionRepository.create({
  //       ...input,
  //     }),
  //   );
  // }
  // async update(id: number, input: ConditionUpdateDTO) {
  //   const condition = await this.conditionRepository.findOne({
  //     where: { id },
  //   });
  //   if (!condition)
  //     throw new HttpException('does not exists', HttpStatus.BAD_REQUEST);
  //   return await this.conditionRepository
  //     .createQueryBuilder()
  //     .update(Conditions)
  //     .set({ ...input })
  //     .where('id = :id', { id: id })
  //     .execute();
  // }
  // async delete(input: ConditionDeleteDTO) {
  //   const { id: ids } = input;
  //   if (ids?.length > 0) {
  //     await this.conditionRepository.delete(ids);
  //     return new HttpException('deleted', HttpStatus.GONE);
  //   }
  // }
}
