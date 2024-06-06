import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import 'dotenv/config';
import { Ingredients } from 'src/entity/Ingredients';
import moment from 'moment';
import { Dished } from 'src/entity/Dished';
import {
  CreateIngredientDto,
  DishCreateDTO,
  DishDeleteDTO,
  DishFilterDTO,
  DishUpdateDTO,
} from 'src/dish/dto/dish.dto';
import { DishIngredients } from 'src/entity/DishIngredients';
import { Nutrients } from 'src/entity/Nutrients';
import { Type } from 'src/enum/type.enum';
@Injectable()
export class DishedService {
  constructor(
    @InjectRepository(Dished)
    private dishRepository: Repository<Dished>,

    @InjectRepository(Nutrients)
    private nutrientsRepository: Repository<Nutrients>,
    @InjectRepository(Ingredients)
    private ingredientsRepository: Repository<Ingredients>,
    @InjectRepository(DishIngredients)
    private dishIngredientsRepository: Repository<DishIngredients>,
  ) {}

  async findOne(id: number) {
    const ingredient = await this.dishRepository
      .createQueryBuilder('i')
      .leftJoin('i.dishIngredients', 'dishIngredient')
      .leftJoinAndSelect('dishIngredient.Ingredient', 'Id')
      .leftJoinAndMapMany(
        'i.nutrients',
        Nutrients,
        'n',
        'i.id = n.objectId and n.type = :type',
        { type: Type.DISH },
      )
      .where('i.id = :id ', { id: id })
      .getOne();
    if (!ingredient)
      throw new HttpException('does not exists', HttpStatus.BAD_REQUEST);
    return ingredient;
  }
  async findAll(input: DishFilterDTO) {
    const { name } = input;
    const ingredient = await this.dishRepository
      .createQueryBuilder('i')
      .leftJoin(
        'i.dishIngredients',
        'dishIngredient',
        'dishIngredient.deleteAt is NULL',
      )
      .leftJoinAndSelect(
        'dishIngredient.Ingredient',
        'Id',
        'Id.deleteAt is NULL',
      )
      .leftJoinAndMapMany(
        'i.nutrients',
        Nutrients,
        'n',
        'i.id = n.objectId and n.type = :type',
        { type: Type.DISH },
      )
      .where(
        `i.deleteAt is NULL ${name ? 'and LOWER(i.name) like :name' : ''}`,
        {
          ...(name ? { name: `%${name.toLowerCase()}%` } : {}),
        },
      )
      .getMany();
    return ingredient;
  }
  async createOne(input: DishCreateDTO, id: number) {
    const { ingredients } = input;
    const dish = await this.dishRepository.save(
      this.dishRepository.create({
        ...input,
        userID: id,
      }),
    );
    const { id: dishId } = dish;
    await this.calculateNutritionalInfo(dishId, ingredients);
    //await this.
    return dish;
  }
  public async calculateNutritionalInfo(
    dishId: number,
    ingredients: CreateIngredientDto[],
  ) {
    const nutritionalInfo: {
      [key: string]: {
        amount: number;
        unit: string;
        percentOfDailyNeeds: number;
      };
    } = {};

    const nutrientPromises = ingredients.map(async (ingredientDto) => {
      const ingredient = await this.ingredientsRepository.findOne({
        where: { id: ingredientDto.ingredientId },
      });
      if (ingredient) {
        await this.dishIngredientsRepository.save(
          this.dishIngredientsRepository.create({
            DishID: dishId,
            IngredientID: ingredient.id,
            Quantity: ingredientDto.quantity,
          }),
        );
        const nutrients = await this.nutrientsRepository.find({
          where: {
            objectId: ingredientDto.ingredientId,
            type: Type.INGREDIENTS,
          },
        });
        nutrients.forEach((nutrient) => {
          const { name, unit, amount, percentOfDailyNeeds } = nutrient;
          if (!nutritionalInfo[name]) {
            nutritionalInfo[name] = { amount: 0, unit, percentOfDailyNeeds: 0 };
          }
          nutritionalInfo[name].percentOfDailyNeeds +=
            (percentOfDailyNeeds * ingredientDto.quantity) / 100;
          nutritionalInfo[name].amount +=
            (amount * ingredientDto.quantity) / 100;
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
              objectId: dishId,
              type: Type.DISH,
            }),
          );
        },
      ),
    );
    return nutritionalInfo;
  }
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
  async update(id: number, input: DishUpdateDTO) {
    const { ingredients, name, Description } = input;
    const dish = await this.dishRepository.findOne({
      where: { id },
    });
    if (!dish)
      throw new HttpException('does not exists', HttpStatus.BAD_REQUEST);
    const Di = await this.dishIngredientsRepository.find({
      where: { DishID: id },
    });
    await this.dishIngredientsRepository.remove(Di);
    const nutrient = await this.nutrientsRepository.find({
      where: {
        objectId: id,
        type: Type.DISH,
      },
    });
    await this.nutrientsRepository.remove(nutrient);
    await this.calculateNutritionalInfo(id, ingredients);
    return await this.dishRepository.save({
      ...dish,
      name,
      Description,
    });
  }
  async delete(input: DishDeleteDTO) {
    const { id: ids } = input;
    if (ids?.length > 0) {
      await this.dishRepository.update(
        {
          id: In(ids),
        },
        {
          deleteAt: moment().format(),
        },
      );
      await this.dishIngredientsRepository.delete({ DishID: In(ids) });
      await this.nutrientsRepository.delete({
        objectId: In(ids),
        type: Type.DISH,
      });
    }
    return new HttpException('deleted', HttpStatus.GONE);
  }
}
