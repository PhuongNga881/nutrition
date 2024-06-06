import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import 'dotenv/config';
import { Dished } from 'src/entity/Dished';
import { Meals } from 'src/entity/Meal';
import {
  CreateDishDto,
  MealCreateDTO,
  MealDeleteDTO,
  MealFilterDTO,
  MealUpdateDTO,
} from 'src/meals/dto/meals.dto';
import { MealRecipe } from 'src/entity/MealRecipe';
import * as moment from 'moment';
import { Nutrients } from 'src/entity/Nutrients';
import { Type } from 'src/enum/type.enum';
@Injectable()
export class MealService {
  constructor(
    @InjectRepository(Meals)
    private mealRepository: Repository<Meals>,
    @InjectRepository(MealRecipe)
    private mealRecipeRepository: Repository<MealRecipe>,
    @InjectRepository(Dished)
    private dishRepository: Repository<Dished>,
    @InjectRepository(Nutrients)
    private nutrientsRepository: Repository<Nutrients>,
  ) {}

  async findOne(id: number) {
    const ingredient = await this.mealRepository
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.mealRecipe', 'mealRecipe')
      .leftJoinAndSelect('mealRecipe.dish', 'dish', 'dish.deleteAt is NULL')
      .where('i.id = :id', { id: id })
      .getOne();
    if (!ingredient)
      throw new HttpException('does not exists', HttpStatus.BAD_REQUEST);
    return ingredient;
  }
  async findAll(input: MealFilterDTO) {
    const { name, dateMeal, userId } = input;
    const ingredient = await this.mealRepository
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.mealRecipe', 'mealRecipe')
      .leftJoinAndSelect('mealRecipe.dish', 'dish')
      .where(
        `1=1
    ${name ? ' AND LOWER(i.name) LIKE :name' : ''}
    ${userId ? ' AND userId = :userId' : ''}
    ${dateMeal ? ' AND i.dateMeal = :dateMeal' : ''}`,
        {
          ...(name ? { name: `%${name.toLowerCase()}%` } : {}),
          ...(userId ? { userId } : {}),
          ...(dateMeal ? { dateMeal } : {}),
        },
      )
      .getMany();
    return ingredient;
  }
  public async calculateNutritionalInfo(
    mealId: number,
    dishesRecipe: CreateDishDto[],
  ) {
    const nutritionalInfo: {
      [key: string]: {
        amount: number;
        unit: string;
        percentOfDailyNeeds: number;
      };
    } = {};

    const nutrientPromises = dishesRecipe.map(async (dishDto) => {
      const dish = await this.dishRepository.findOne({
        where: { id: dishDto.Id },
      });
      if (dish) {
        await this.mealRecipeRepository.save(
          this.mealRecipeRepository.create({
            dishId: dish.id,
            mealId,
            Quantity: dishDto.quantity,
          }),
        );
        const nutrients = await this.nutrientsRepository.find({
          where: {
            objectId: dish.id,
            type: Type.DISH,
          },
        });
        nutrients.forEach((nutrient) => {
          const { name, unit, amount, percentOfDailyNeeds } = nutrient;
          if (!nutritionalInfo[name]) {
            nutritionalInfo[name] = { amount: 0, unit, percentOfDailyNeeds: 0 };
          }
          nutritionalInfo[name].percentOfDailyNeeds +=
            (percentOfDailyNeeds * dishDto.quantity) / 100;
          nutritionalInfo[name].amount += (amount * dishDto.quantity) / 100;
        });
      }
    });
    await Promise.all(nutrientPromises);
    await Promise.all(
      Object.entries(nutritionalInfo).map(
        async ([name, { amount, unit, percentOfDailyNeeds }]) => {
          await this.nutrientsRepository.save(
            this.nutrientsRepository.create({
              name,
              amount,
              unit,
              percentOfDailyNeeds,
              objectId: mealId,
              type: Type.MEAL,
            }),
          );
        },
      ),
    );
    return nutritionalInfo;
  }
  async createOne(input: MealCreateDTO, userID: any) {
    const { dishesRecipe, dateMeal } = input;
    const dish = await this.mealRepository.save(
      this.mealRepository.create({
        ...input,
        userID,
        dateMeal: moment(dateMeal).format(),
      }),
    );
    await this.calculateNutritionalInfo(dish.id, dishesRecipe);
    //await this.
    return dish;
  }
  // toi uwu
  //   async createMany(note: NotesDTO[], workspaceId: number, accountId: number) {
  //     console.log(workspaceId);
  //     const Notes = note.map((n) => ({
  //       ...n,
  //       workspaceId: workspaceId,
  //     }));
  //     const checkId = this.checkIdAccount(accountId, workspaceId);
  //     if (!checkId)
  //       return new ResponseData(
  //         [],
  //         HttpStatus.BAD_REQUEST,
  //         HttpMessage.BAD_REQUEST,
  //       );

  //     const noteSave = await this.noteRepository
  //       .createQueryBuilder()
  //       .insert()
  //       .into(notes)
  //       .values(Notes)
  //       .execute();
  //     return new ResponseData(noteSave, HttpStatus.CREATED, HttpMessage.SUCCESS);
  //   }
  async update(id: number, input: MealUpdateDTO) {
    const { dishesRecipe } = input;
    const meal = await this.mealRepository.findOne({
      where: { id },
    });
    if (!meal)
      throw new HttpException('does not exists', HttpStatus.BAD_REQUEST);
    const Di = await this.mealRecipeRepository.find({
      where: { mealId: id },
    });
    await this.mealRecipeRepository.remove(Di);
    await this.nutrientsRepository.delete({ objectId: id, type: Type.MEAL });
    await this.calculateNutritionalInfo(id, dishesRecipe);
    return await this.mealRepository.save({ ...meal, ...input });
  }
  async delete(input: MealDeleteDTO) {
    const { id: ids } = input;
    if (ids?.length > 0) {
      await this.mealRepository.delete(ids);
      await this.mealRecipeRepository.delete({ dishId: In(ids) });
      await this.nutrientsRepository.delete({
        objectId: In(ids),
        type: Type.MEAL,
      });
    }
    return new HttpException('deleted', HttpStatus.GONE);
  }
}
