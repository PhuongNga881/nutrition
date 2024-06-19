import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import 'dotenv/config';
import { Dished } from 'src/entity/Dished';
import { Meals } from 'src/entity/Meal';
import {
  CreateDishDto,
  MealAddDishDTO,
  MealCreateDTO,
  MealDeleteDTO,
  MealFilterDTO,
  MealUpdateDTO,
} from 'src/meals/dto/meals.dto';
import { MealRecipe } from 'src/entity/MealRecipe';
import * as moment from 'moment';
import { Nutrients } from 'src/entity/Nutrients';
import { Type } from 'src/enum/type.enum';
import { Properties } from 'src/entity/properties';
import { Flavonoids } from 'src/entity/flavonoids';
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
    @InjectRepository(Properties)
    private propertiesRepository: Repository<Properties>,
    @InjectRepository(Flavonoids)
    private flavonoidsRepository: Repository<Flavonoids>,
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
    let nutrient = await this.nutrientsRepository.find({
      where: { objectId: id, type: Type.MEAL },
    });
    nutrient = await this.sortNutrients(nutrient);
    return { ingredient, nutrient };
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
  async findAll(input: MealFilterDTO) {
    const { name, dateMeal, userId } = input;
    const ingredient = await this.mealRepository
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.mealRecipe', 'mealRecipe')
      .leftJoinAndSelect('mealRecipe.dish', 'dish')
      .leftJoinAndMapMany(
        'i.nutrients',
        Nutrients,
        'n',
        'i.id = n.objectId and n.type = :type',
        { type: Type.MEAL },
      )
      .leftJoinAndMapMany(
        'i.properties',
        Properties,
        'p',
        'i.id = p.objectId and p.type = :type',
        { type: Type.MEAL },
      )
      .leftJoinAndMapMany(
        'i.flavonoids',
        Flavonoids,
        'f',
        'i.id = f.objectId and f.type = :type',
        { type: Type.MEAL },
      )
      .where(
        `1=1
    ${name ? ' AND LOWER(i.name) LIKE :name' : ''}
    ${userId ? ' AND i.userId = :userId' : ''}
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
  public async addDish(id: number, input: MealAddDishDTO) {
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
    const dishs = Di.map((di) => {
      const { dishId: Id, Quantity: quantity } = di;
      return { Id: Number(Id), quantity: Number(quantity) };
    });

    const inputDishes = dishesRecipe.map((dish) => ({
      Id: Number(dish.Id),
      quantity: Number(dish.quantity),
    }));

    const combinedDishes: CreateDishDto[] = [...dishs, ...inputDishes];

    const uniqueDishes = combinedDishes.reduce((acc, current) => {
      const existingDish = acc.find((item) => item.Id === current.Id);
      if (!existingDish) {
        return acc.concat([current]);
      } else {
        existingDish.quantity += current.quantity;
        return acc;
      }
    }, []);
    console.log(uniqueDishes);
    await this.nutrientsRepository.delete({ objectId: id, type: Type.MEAL });
    await this.calculateNutritionalInfo(id, uniqueDishes);
    return await this.mealRepository.save({ ...meal, ...input });
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
        const properties = await this.propertiesRepository.find({
          where: {
            objectId: dish.id,
            type: Type.DISH,
          },
        });
        const flavonoids = await this.flavonoidsRepository.find({
          where: {
            objectId: dish.id,
            type: Type.DISH,
          },
        });
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
            percentOfDailyNeeds * dishDto.quantity;
          nutritionalInfo[name].amount += amount * dishDto.quantity;
        });
        properties.forEach((pro) => {
          const { name, unit, amount } = pro;
          if (!propertiesInfo[name]) {
            propertiesInfo[name] = { amount: 0, unit };
          }
          propertiesInfo[name].amount += amount * dishDto.quantity;
        });
        flavonoids.forEach((pro) => {
          const { name, unit, amount } = pro;
          if (!flavonoidsInfo[name]) {
            flavonoidsInfo[name] = { amount: 0, unit };
          }
          flavonoidsInfo[name].amount += amount * dishDto.quantity;
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
    await Promise.all(
      Object.entries(propertiesInfo).map(async ([name, { amount, unit }]) => {
        await this.propertiesRepository.save(
          this.propertiesRepository.create({
            name,
            amount,
            unit,
            objectId: mealId,
            type: Type.MEAL,
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
            objectId: mealId,
            type: Type.MEAL,
          }),
        );
      }),
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
      await this.nutrientsRepository.delete({
        objectId: In(ids),
        type: Type.MEAL,
      });
      await this.mealRecipeRepository.delete({ dishId: In(ids) });
      await this.mealRepository.delete(ids);
    }
    return new HttpException('deleted', HttpStatus.GONE);
  }
  async calculateDailyNutrition(userId: number, date: string) {
    return this.calculateNutritionForPeriod(
      userId,
      moment(date),
      moment(date).add(1, 'days'),
    );
  }

  // New method to calculate weekly nutrition
  async calculateWeeklyNutrition(userId: number, weekStartDate: string) {
    return this.calculateNutritionForPeriod(
      userId,
      moment(weekStartDate),
      moment(weekStartDate).add(1, 'weeks'),
    );
  }

  // New method to calculate monthly nutrition
  async calculateMonthlyNutrition(userId: number, monthStartDate: string) {
    return this.calculateNutritionForPeriod(
      userId,
      moment(monthStartDate),
      moment(monthStartDate).add(1, 'months'),
    );
  }

  // Helper method to calculate nutrition for a given period
  private async calculateNutritionForPeriod(
    userId: number,
    startDate: moment.Moment,
    endDate: moment.Moment,
  ) {
    const meals = await this.mealRepository.find({
      where: {
        userID: userId,
        dateMeal: In(this.getDateRangeArray(startDate, endDate)),
      },
    });
    console.log(this.getDateRangeArray(startDate, endDate));
    console.log(meals);
    const propertiesInfo: {
      [key: string]: {
        amount: number;
        unit: string;
      };
    } = {};
    let nutritionalInfo: {
      [key: string]: {
        amount: number;
        unit: string;
        percentOfDailyNeeds: number;
      };
    } = {};
    const flavonoidsInfo: {
      [key: string]: {
        amount: number;
        unit: string;
      };
    } = {};
    for (const meal of meals) {
      const nutrients = await this.nutrientsRepository.find({
        where: {
          objectId: meal.id,
          type: Type.MEAL,
        },
      });

      const properties = await this.propertiesRepository.find({
        where: {
          objectId: meal.id,
          type: Type.MEAL,
        },
      });
      const flavonoids = await this.flavonoidsRepository.find({
        where: {
          objectId: meal.id,
          type: Type.MEAL,
        },
      });
      nutrients.forEach((nutrient) => {
        const { name, unit, amount, percentOfDailyNeeds } = nutrient;
        if (!nutritionalInfo[name]) {
          nutritionalInfo[name] = { amount: 0, unit, percentOfDailyNeeds: 0 };
        }
        nutritionalInfo[name].amount += Number(amount);
        nutritionalInfo[name].percentOfDailyNeeds += percentOfDailyNeeds;
      });
      properties.forEach((pro) => {
        const { name, unit, amount } = pro;
        if (!propertiesInfo[name]) {
          propertiesInfo[name] = { amount: 0, unit };
        }
        propertiesInfo[name].amount += Number(amount);
      });
      flavonoids.forEach((pro) => {
        const { name, unit, amount } = pro;
        if (!flavonoidsInfo[name]) {
          flavonoidsInfo[name] = { amount: 0, unit };
        }
        flavonoidsInfo[name].amount += Number(amount);
      });
    }
    nutritionalInfo = await this.sortNutritionalInfo(nutritionalInfo);

    return { nutritionalInfo, propertiesInfo, flavonoidsInfo };
  }
  async sortNutritionalInfo(nutritionalInfo) {
    const order = ['Calories', 'Carbohydrates', 'Fat', 'Protein'];
    const sortedNutritionalInfo = {};

    // First, add the nutrients in the specified order
    order.forEach((nutrientName) => {
      Object.keys(nutritionalInfo).forEach((key) => {
        if (key.toLowerCase().includes(nutrientName.toLowerCase())) {
          sortedNutritionalInfo[key] = nutritionalInfo[key];
        }
      });
    });

    // Then, add the remaining nutrients (including Vitamins)
    Object.keys(nutritionalInfo).forEach((key) => {
      if (!Object.keys(sortedNutritionalInfo).includes(key)) {
        sortedNutritionalInfo[key] = nutritionalInfo[key];
      }
    });

    return sortedNutritionalInfo;
  }

  // Helper method to generate date range array
  private getDateRangeArray(
    start: moment.Moment,
    end: moment.Moment,
  ): string[] {
    const dateArray = [];
    let currentDate = start.clone();
    while (currentDate < end) {
      dateArray.push(currentDate.format('YYYY-MM-DD'));
      currentDate = currentDate.add(1, 'days');
    }
    return dateArray;
  }
}
