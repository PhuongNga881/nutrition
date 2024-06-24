import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import 'dotenv/config';
import { Ingredients } from 'src/entity/Ingredients';
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
import { WeightPerServing } from 'src/entity/WeightPerServing';
import { Properties } from 'src/entity/properties';
import { Flavonoids } from 'src/entity/flavonoids';
import { TypeIntolerances } from 'src/entity/typeIntolerances';
import { Intolerances } from 'src/entity/intolerances';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { name } from 'ejs';
@Injectable()
export class DishedService {
  constructor(
    @InjectRepository(Dished)
    private dishRepository: Repository<Dished>,
    @InjectRepository(WeightPerServing)
    private weightPerServingsRepository: Repository<WeightPerServing>,
    @InjectRepository(Nutrients)
    private nutrientsRepository: Repository<Nutrients>,
    @InjectRepository(Properties)
    private propertiesRepository: Repository<Properties>,
    @InjectRepository(Ingredients)
    private ingredientsRepository: Repository<Ingredients>,
    @InjectRepository(DishIngredients)
    private dishIngredientsRepository: Repository<DishIngredients>,
    @InjectRepository(Flavonoids)
    private flavonoidsRepository: Repository<Flavonoids>,
    @InjectRepository(TypeIntolerances)
    private intolerancesRepository: Repository<TypeIntolerances>,
    @InjectRepository(Intolerances)
    private intolerancesRRepository: Repository<Intolerances>,
    private readonly configService: ConfigService,
    @InjectRepository(WeightPerServing)
    private weightPerServingRepository: Repository<WeightPerServing>,
  ) {}

  async findOne(id: number) {
    const dish = await this.dishRepository
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.dishIngredients', 'dishIngredient')
      .leftJoinAndSelect('dishIngredient.Ingredient', 'Id')
      .leftJoinAndMapMany(
        'i.weightPerServing',
        WeightPerServing,
        'w',
        'i.id = w.objectId and w.type = :type',
        { type: Type.DISH },
      )
      .where('i.id = :id ', { id: id })
      .getOne();
    if (!dish)
      throw new HttpException('does not exists', HttpStatus.BAD_REQUEST);
    let nutrient = await this.nutrientsRepository.find({
      where: { objectId: id, type: Type.DISH },
    });
    nutrient = await this.sortNutrients(nutrient);
    return { dish, nutrient };
  }
  async sortNutrients(nutrients) {
    const order = ['Calories', 'Carbohydrates', 'Fat', 'Protein'];
    const sortedNutrients = [];

    // First, push the nutrients that are in the order
    order.forEach((nutrientName) => {
      const nutrient = nutrients.find((n) => n.name === nutrientName);
      if (nutrient) {
        sortedNutrients.push(nutrient);
      }
    });

    // Then, push the remaining nutrients
    nutrients.forEach((nutrient) => {
      if (!order.includes(nutrient.name)) {
        sortedNutrients.push(nutrient);
      }
    });

    return sortedNutrients;
  }
  async findAll(input: DishFilterDTO) {
    const { name, UserId, isAll, intolerances } = input;
    const ingredient = await this.dishRepository
      .createQueryBuilder('i')
      .leftJoinAndSelect(
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
      .leftJoinAndMapMany(
        'i.weightPerServing',
        WeightPerServing,
        'w',
        'i.id = w.objectId and w.type = :type',
        { type: Type.DISH },
      )
      .leftJoinAndMapMany(
        'i.properties',
        Properties,
        'p',
        'i.id = p.objectId and p.type = :type',
        { type: Type.DISH },
      )
      .leftJoinAndMapMany(
        'i.flavonoids',
        Flavonoids,
        'f',
        'i.id = f.objectId and f.type = :type',
        { type: Type.DISH },
      )
      .where(
        `i.deleteAt is NULL 
        ${name ? ' and LOWER(i.name) like :name' : ''}
        ${UserId ? ' and i.userID = :userId' : ''}
         ${intolerances ? ' and it.id IN (:...intolerances)' : ''}
        ${isAll?.toString() === 'true' || isAll?.toString() === 'false' ? ' and i.isAll = :isAll' : ''}`,
        {
          ...(name ? { name: `%${name.toLowerCase()}%` } : {}),
          ...(UserId ? { UserId } : {}),
          ...(intolerances ? { intolerances } : {}),
          ...(isAll?.toString() === 'true' || isAll?.toString() === ' false'
            ? { isAll: isAll?.toString() === 'true' ? 1 : 0 }
            : {}),
        },
      )
      .getMany();
    return ingredient;
  }
  // async getAllIntolerances() {
  //   return await this.intolerancesRRepository.createQueryBuilder('i').getMany();
  // }
  async createOne(input: DishCreateDTO, id: number) {
    const { ingredients, UserId } = input;
    const dish = await this.dishRepository.save(
      this.dishRepository.create({
        ...input,
        ...(UserId ? { UserID: UserId } : { UserID: id }),
      }),
    );
    const { id: dishId } = dish;
    await this.calculateNutritionalInfo(dishId, ingredients);
    //await this.
    // if (intolerances && intolerances.length > 0) {
    //   for (const intolerancesId of intolerances) {
    //     await this.intolerancesRepository.save(
    //       this.intolerancesRepository.create({
    //         intolerancesId,
    //         objectId: dishId,
    //         type: Type.DISH,
    //       }),
    //     );
    //   }
    // }
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
    const propertiesInfo: {
      [key: string]: {
        amount: number;
        unit: string;
      };
    } = {};
    const flavonoidsInfo: {
      [key: string]: {
        amount: number;
        unit: string;
      };
    } = {};
    let amountDish = 0;
    const nutrientPromises = ingredients.map(async (ingredientDto) => {
      const ingredient = await this.ingredientsRepository.findOne({
        where: { id: ingredientDto.ingredientId },
      });
      // console.log(ingredient);
      if (ingredient) {
        await this.dishIngredientsRepository.save(
          this.dishIngredientsRepository.create({
            DishID: dishId,
            IngredientID: ingredient.id,
            Quantity: ingredientDto.quantity,
          }),
        );
        const weightPerServing = await this.weightPerServingsRepository.findOne(
          {
            where: {
              objectId: ingredientDto.ingredientId,
              type: Type.INGREDIENTS,
            },
          },
        );
        const { amount: amountWeightPerServing } = weightPerServing;
        amountDish += ingredientDto.quantity;
        const nutrients = await this.nutrientsRepository.find({
          where: {
            objectId: ingredientDto.ingredientId,
            type: Type.INGREDIENTS,
          },
        });
        const properties = await this.propertiesRepository.find({
          where: {
            objectId: ingredientDto.ingredientId,
            type: Type.INGREDIENTS,
          },
        });
        const flavonoids = await this.flavonoidsRepository.find({
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
            (percentOfDailyNeeds * ingredientDto.quantity) /
            amountWeightPerServing;
          nutritionalInfo[name].amount +=
            (amount * ingredientDto.quantity) / amountWeightPerServing;
        });
        properties.forEach((pro) => {
          const { name, unit, amount } = pro;
          if (!propertiesInfo[name]) {
            propertiesInfo[name] = { amount: 0, unit };
          }
          if (name === 'Nutrition Score') {
            propertiesInfo[name].amount =
              Number(propertiesInfo[name].amount) + amount;
            2;
          } else {
            propertiesInfo[name].amount +=
              (amount * ingredientDto.quantity) / amountWeightPerServing;
          }
        });
        flavonoids.forEach((pro) => {
          const { name, unit, amount } = pro;
          if (!flavonoidsInfo[name]) {
            flavonoidsInfo[name] = { amount: 0, unit };
          }
          flavonoidsInfo[name].amount +=
            (amount * ingredientDto.quantity) / amountWeightPerServing;
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
    await Promise.all(
      Object.entries(propertiesInfo).map(async ([name, { amount, unit }]) => {
        await this.propertiesRepository.save(
          this.propertiesRepository.create({
            name,
            amount,
            unit,
            objectId: dishId,
            type: Type.DISH,
          }),
        );
      }),
    );
    await Promise.all(
      Object.entries(flavonoidsInfo).map(async ([name, { amount, unit }]) => {
        await this.flavonoidsRepository.save(
          this.flavonoidsRepository.create({
            name,
            amount,
            unit,
            objectId: dishId,
            type: Type.DISH,
          }),
        );
      }),
    );
    await this.weightPerServingsRepository.save(
      this.weightPerServingsRepository.create({
        amount: amountDish,
        type: Type.DISH,
        objectId: dishId,
        unit: 'g',
      }),
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
    const properties = await this.propertiesRepository.find({
      where: {
        objectId: id,
        type: Type.DISH,
      },
    });
    const flavonoids = await this.flavonoidsRepository.find({
      where: {
        objectId: id,
        type: Type.DISH,
      },
    });
    await this.nutrientsRepository.remove(nutrient);
    await this.flavonoidsRepository.remove(flavonoids);
    await this.propertiesRepository.remove(properties);
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
      await this.dishRepository.delete({
        id: In(ids),
      });
      await this.dishIngredientsRepository.delete({ DishID: In(ids) });
      await this.nutrientsRepository.delete({
        objectId: In(ids),
        type: Type.DISH,
      });
      await this.flavonoidsRepository.delete({
        objectId: In(ids),
        type: Type.DISH,
      });
      await this.propertiesRepository.delete({
        objectId: In(ids),
        type: Type.DISH,
      });
    }
    return new HttpException('deleted', HttpStatus.GONE);
  }

  async getData() {
    const apiKey = this.configService.get<string>('API_KEY');
    const dishs = await this.dishRepository.find({ select: ['code', 'id'] });
    for (const dish of dishs) {
      const { code: codeDish } = dish;
      console.log(codeDish);
      const url4 = `https://api.spoonacular.com/recipes/${codeDish}/ingredientWidget.json?&apiKey=${apiKey}`;
      const data4 = await axios.get(url4);
      const { ingredients: extendedIngredients } = data4?.data;
      //console.log(title);
      // await this.dishRepository.save({
      //   ...dish,
      //   name: title,
      // });
      for (const ingredientDish of extendedIngredients) {
        const { name: nameIngredient } = ingredientDish;
        console.log(nameIngredient);
        const ingredient = await this.ingredientsRepository.findOne({
          where: { name: nameIngredient },
        });
        if (!ingredient) {
          const url = `https://api.spoonacular.com/food/ingredients/search?apiKey=${apiKey}&query=${nameIngredient}&number=1`;
          const data1 = await axios.get(url);
          const ingredientDataId = data1?.data?.results?.[0]?.id;
          console.log(nameIngredient);
          console.log(dish);
          console.log('xhay', ingredientDataId);
          const url1 = `https://api.spoonacular.com/food/ingredients/${ingredientDataId}/information?amount=100&unit=grams&apiKey=${apiKey}`;
          const data2 = await axios.get(url1);
          const { original, originalName, image, nutrition, name } =
            data2?.data;
          const ingredientCreate = await this.ingredientsRepository.save({
            original,
            originalName,
            image,
            name,
          });
          const { id: ingredientCreateId } = ingredientCreate;
          const { nutrients, weightPerServing } = nutrition;

          if (nutrients.length > 0) {
            for (const nutrient of nutrients) {
              await this.nutrientsRepository.save(
                this.nutrientsRepository.create({
                  ...nutrient,
                  objectId: ingredientCreateId,
                  type: Type.INGREDIENTS,
                }),
              );
            }
          }
          if (weightPerServing) {
            await this.weightPerServingRepository.save(
              this.weightPerServingRepository.create({
                ...weightPerServing,
                objectId: ingredientCreateId,
                type: Type.INGREDIENTS,
              }),
            );
          }
        }
      }
    }
  }
}
