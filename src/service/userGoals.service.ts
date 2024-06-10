import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { Nutrients } from 'src/entity/Nutrients';
import { EXERCISE, Type } from 'src/enum/type.enum';
import { WeightPerServing } from 'src/entity/WeightPerServing';
import { CaloricBreakdown } from 'src/entity/CaloricBreakdown';
import { UserGoals } from 'src/entity/UserGoals';
import {
  UserGoalsCreateDTO,
  UserGoalsDeleteDTO,
  UserGoalsFilterDTO,
  UsersGoalsUpdate,
  UsersGoalsUpdateByUser,
  UsersGoalsUpdateCondition,
} from 'src/userGoals/dto/userGoals.dto';
import { userConditions } from 'src/entity/UserConditions';
@Injectable()
export class UserGoalsService {
  constructor(
    @InjectRepository(UserGoals)
    private userGoalsRepository: Repository<UserGoals>,
    @InjectRepository(userConditions)
    private userConditionsRepository: Repository<userConditions>,
    @InjectRepository(Nutrients)
    private nutrientsRepository: Repository<Nutrients>,
    @InjectRepository(WeightPerServing)
    private weightPerServingRepository: Repository<WeightPerServing>,
    @InjectRepository(CaloricBreakdown)
    private caloricBreakdownRepository: Repository<CaloricBreakdown>,
    private readonly configService: ConfigService,
  ) {}

  async findOne(id: number) {
    const userGoal = await this.userGoalsRepository
      .createQueryBuilder('i')
      .leftJoinAndMapMany(
        'i.nutrients',
        Nutrients,
        'n',
        'i.id = n.objectId and n.type = :type',
        { type: Type.USER_GOALS },
      )
      .where('i.id = :id', { id: id })
      .getOne();
    if (!userGoal)
      throw new HttpException('does not exists', HttpStatus.BAD_REQUEST);
    return userGoal;
  }
  async findAll(input: UserGoalsFilterDTO) {
    const { userId, exercise } = input;
    const ingredient = await this.userGoalsRepository
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.User', 'user')
      .leftJoinAndMapMany(
        'i.nutrients',
        Nutrients,
        'n',
        'i.id = n.objectId and n.type = :type',
        { type: Type.USER_GOALS },
      )
      .where(
        `1=1 ${userId ? ' and userId : userId' : ''} ${exercise ? 'and exercise : exercise' : ''}`,
        {
          ...(userId ? { userId } : {}),
          ...(exercise ? { exercise } : {}),
        },
      )
      .getMany();
    return ingredient;
  }
  async calculator(input: UserGoalsCreateDTO) {
    const { sex, height, weight, age, exercise } = input;
    const BMR =
      (weight ? weight * 10 : 0) +
      (height ? height * 6.25 : 0) -
      (age ? 5 * age : 0) +
      (sex ? 5 : -161);
    const heightByM = height / 100;
    const BMI = weight / heightByM ** 2;
    const TEE = BMR ? BMR + BMR * 0.1 : 0;
    let TDEE;
    if (exercise) {
      if (exercise === EXERCISE.LITTLE_OR_NO_EXERCISE)
        TDEE = TEE ? TEE * 1.2 : 0;
      else if (exercise === EXERCISE.LIGHT_ACTIVITY)
        TDEE = TEE ? TEE * 1.375 : 0;
      else if (exercise === EXERCISE.EXTRA_ACTIVE) TDEE = TEE ? TEE * 1.9 : 0;
      else if (exercise === EXERCISE.MODERATE_ACTIVITY)
        TDEE = TEE ? TEE * 1.55 : 0;
      else if (exercise === EXERCISE.VERY_ACTIVE) TDEE = TEE ? TEE * 1.725 : 0;
    }
    return { BMI, TEE, TDEE, BMR };
  }
  async createOne(input: UserGoalsCreateDTO) {
    const { conditionIds } = input;
    // const BMR =
    //   (weight ? weight * 10 : 0) +
    //   (height ? height * 6.25 : 0) -
    //   (age ? 5 * age : 0) +
    //   (sex ? 5 : -161);
    // const heightByM = height / 100;
    // const BMI = weight / heightByM ** 2;
    // const TEE = BMR ? BMI + BMI * 0.1 : 0;
    // let TDEE;
    // if (exercise) {
    //   if (exercise === EXERCISE.LITTLE_OR_NO_EXERCISE)
    //     TDEE = TEE ? TEE * 1.2 : 0;
    //   else if (exercise === EXERCISE.LIGHT_ACTIVITY)
    //     TDEE = TEE ? TEE * 1.375 : 0;
    //   else if (exercise === EXERCISE.EXTRA_ACTIVE) TDEE = TEE ? TEE * 1.9 : 0;
    //   else if (exercise === EXERCISE.MODERATE_ACTIVITY)
    //     TDEE = TEE ? TEE * 1.55 : 0;
    //   else if (exercise === EXERCISE.VERY_ACTIVE) TDEE = TEE ? TEE * 1.725 : 0;
    // }
    let { BMR, BMI, TEE, TDEE } = await this.calculator(input);
    let nutrients = await this.createDataNutrients(input, TDEE);
    if (conditionIds) {
      if (conditionIds.length > 0) {
        for (const id of conditionIds) {
          console.log(id);
          ({ nutrients, TDEE } = await this.adjustNutrientsForCondition(
            nutrients,
            id,
            TDEE,
          ));
        }
      }
    }
    const userGoal = await this.userGoalsRepository.save(
      this.userGoalsRepository.create({ ...input, BMR, BMI, TEE, TDEE }),
    );
    const { id } = userGoal;
    for (const nutrient of nutrients) {
      await this.nutrientsRepository.save(
        this.nutrientsRepository.create({
          ...nutrient,
          objectId: id,
          type: Type.USER_GOALS,
        }),
      );
    }
    const { id: userGoalId } = userGoal;
    if (conditionIds) {
      if (conditionIds.length > 0) {
        for (const conditionId of conditionIds) {
          await this.userConditionsRepository.save(
            this.userConditionsRepository.create({
              userGoalId,
              conditionId,
            }),
          );
        }
      }
    }
    return userGoal;
  }
  async createDataNutrients(input: UserGoalsCreateDTO, TDEE: number) {
    const { sex, age } = input;
    const nutrient = [];
    const Protein = {
      name: 'Protein',
      amount: (TDEE * 0.2) / 4,
      unit: 'g',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(Protein);
    const Fat = {
      name: 'Fat',
      amount: (TDEE * 0.3) / 9,
      unit: 'g',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(Fat);
    const Carb = {
      name: 'Carbohydrates',
      amount: (TDEE * 0.5) / 4,
      unit: 'g',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(Carb);
    const fiber = {
      name: 'Fiber',
      amount: (TDEE * 14) / 1000,
      unit: 'g',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(fiber);
    const Water = {
      name: 'Water',
      amount: TDEE / 1000,
      unit: 'liters',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(Water);
    const VitaminA = {
      name: 'Vitamin A',
      amount:
        age >= 1 && age <= 3
          ? 300
          : age >= 4 && age <= 8
            ? 400
            : age >= 9 && age <= 13
              ? 600
              : age >= 14 && sex
                ? 900
                : 700,
      unit: 'μg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(VitaminA);
    const VitaminC = {
      name: 'Vitamin C',
      amount:
        age >= 1 && age <= 3
          ? 15
          : age >= 4 && age <= 8
            ? 25
            : age >= 9 && age <= 13
              ? 45
              : age >= 14 && age <= 18
                ? sex
                  ? 75
                  : 65
                : age >= 19 && sex
                  ? 90
                  : 75,
      unit: 'mg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(VitaminC);
    const VitaminD = {
      name: 'Vitamin D',
      amount:
        age >= 1 && age <= 3
          ? 600
          : age >= 4 && age <= 8
            ? 600
            : age >= 9 && age <= 18
              ? 600
              : age >= 19 && age <= 70
                ? 600
                : 800,
      unit: 'IU',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(VitaminD);
    const VitaminE = {
      name: 'Vitamin E',
      amount:
        age >= 1 && age <= 3
          ? 6
          : age >= 4 && age <= 8
            ? 7
            : age >= 9 && age <= 13
              ? 11
              : 15,
      unit: 'mg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(VitaminE);
    const VitaminK = {
      name: 'Vitamin K',
      amount:
        age >= 1 && age <= 3
          ? 30
          : age >= 4 && age <= 8
            ? 55
            : age >= 9 && age <= 13
              ? 60
              : age >= 14 && age <= 18
                ? 75
                : age >= 19 && sex
                  ? 120
                  : 90,
      unit: 'µg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(VitaminK);
    const VitaminB1 = {
      name: 'Vitamin B1',
      amount:
        age >= 1 && age <= 3
          ? 0.5
          : age >= 4 && age <= 8
            ? 0.6
            : age >= 9 && age <= 13
              ? 0.9
              : age >= 14 && age <= 18
                ? sex
                  ? 1.2
                  : 1.0
                : age >= 19 && sex
                  ? 1.2
                  : 1.1,
      unit: 'mg',
      percentOfDailyNeeds: 100,
    };
    const VitaminB2 = {
      name: 'Vitamin B2',
      amount:
        age >= 1 && age <= 3
          ? 0.5
          : age >= 4 && age <= 8
            ? 0.6
            : age >= 9 && age <= 13
              ? 0.9
              : age >= 14 && age <= 18
                ? sex
                  ? 1.3
                  : 1.0
                : age >= 19 && sex
                  ? 1.3
                  : 1.1,
      unit: 'mg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(VitaminB2);
    const VitaminB3 = {
      name: 'Vitamin B3',
      amount:
        age >= 1 && age <= 3
          ? 6
          : age >= 4 && age <= 8
            ? 8
            : age >= 9 && age <= 13
              ? 12
              : age >= 14 && sex
                ? 16
                : 14,
      unit: 'mg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(VitaminB3);
    const VitaminB6 = {
      name: 'Vitamin B6',
      amount:
        age >= 1 && age <= 3
          ? 0.5
          : age >= 4 && age <= 8
            ? 0.6
            : age >= 9 && age <= 13
              ? 1.0
              : age >= 14 && age <= 18
                ? sex
                  ? 1.3
                  : 1.2
                : age >= 19 && age <= 50
                  ? 1.3
                  : age > 50 && sex
                    ? 1.7
                    : 1.5,
      unit: 'mg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(VitaminB6);
    const VitaminB9 = {
      name: 'Vitamin B9',
      amount:
        age >= 1 && age <= 3
          ? 150
          : age >= 4 && age <= 8
            ? 200
            : age >= 9 && age <= 13
              ? 300
              : 400,
      unit: 'µg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(VitaminB9);
    const VitaminB12 = {
      name: 'Vitamin B12',
      amount:
        age >= 1 && age <= 3
          ? 0.9
          : age >= 4 && age <= 8
            ? 1.2
            : age >= 9 && age <= 13
              ? 1.8
              : 2.4,
      unit: 'µg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(VitaminB12);
    const VitaminB5 = {
      name: 'Vitamin B5',
      amount:
        age >= 1 && age <= 3
          ? 2
          : age >= 4 && age <= 8
            ? 3
            : age >= 9 && age <= 13
              ? 4
              : 5,
      unit: 'mg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(VitaminB5);
    const VitaminB7 = {
      name: 'Vitamin B7',
      amount:
        age >= 1 && age <= 3
          ? 8
          : age >= 4 && age <= 8
            ? 12
            : age >= 9 && age <= 13
              ? 20
              : age >= 14 && age <= 18
                ? 25
                : 30,
      unit: 'µg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(VitaminB7);
    nutrient.push(VitaminB1);
    const Choline = {
      name: 'Choline',
      amount:
        age >= 1 && age <= 3
          ? 200
          : age >= 4 && age <= 8
            ? 250
            : age >= 9 && age <= 13
              ? 375
              : age >= 14 && age <= 18
                ? sex
                  ? 550
                  : 400
                : age >= 19 && sex
                  ? 550
                  : 425,
      unit: 'mg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(Choline);
    const Calcium = {
      name: 'Calcium',
      amount:
        age >= 1 && age <= 3
          ? 700
          : age >= 4 && age <= 8
            ? 1000
            : age >= 9 && age <= 18
              ? 1300
              : age >= 19 && age <= 50
                ? 1000
                : 1200,
      unit: 'mg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(Calcium);
    const Iron = {
      name: 'Iron',
      amount:
        age >= 1 && age <= 3
          ? 7
          : age >= 4 && age <= 8
            ? 10
            : age >= 9 && age <= 13
              ? 8
              : age >= 14 && age <= 18
                ? sex
                  ? 11
                  : 15
                : age >= 19 && age <= 50
                  ? sex
                    ? 8
                    : 18
                  : 8,
      unit: 'mg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(Iron);
    const Magnesium = {
      name: 'Magnesium',
      amount:
        age >= 1 && age <= 3
          ? 80
          : age >= 4 && age <= 8
            ? 130
            : age >= 9 && age <= 13
              ? 240
              : age >= 14 && age <= 18
                ? sex
                  ? 410
                  : 360
                : age >= 19 && age <= 30
                  ? sex
                    ? 400
                    : 310
                  : sex
                    ? 420
                    : 320,
      unit: 'mg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(Magnesium);
    const Potassium = {
      name: 'Potassium',
      amount:
        age >= 1 && age <= 3
          ? 3000
          : age >= 4 && age <= 8
            ? 3800
            : age >= 9 && age <= 13
              ? 4500
              : 4700,
      unit: 'mg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(Potassium);
    const Sodium = {
      name: 'Sodium',
      amount:
        age >= 1 && age <= 3
          ? 1000
          : age >= 4 && age <= 8
            ? 1200
            : age >= 9 && age <= 13
              ? 1500
              : age >= 14 && age <= 50
                ? 1500
                : age >= 51 && age <= 70
                  ? 1300
                  : 1200,
      unit: 'mg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(Sodium);
    const Zinc = {
      name: 'Zinc',
      amount:
        age >= 1 && age <= 3
          ? 3
          : age >= 4 && age <= 8
            ? 5
            : age >= 9 && age <= 13
              ? 8
              : age >= 14 && sex
                ? 11
                : 9,
      unit: 'mg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(Zinc);
    const Copper = {
      name: 'Copper',
      amount:
        age >= 1 && age <= 3
          ? 340
          : age >= 4 && age <= 8
            ? 440
            : age >= 9 && age <= 13
              ? 700
              : age >= 14 && age <= 18
                ? 890
                : 900,
      unit: 'µg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(Copper);
    const Manganese = {
      name: 'Manganese',
      amount:
        age >= 1 && age <= 3
          ? 1.2
          : age >= 4 && age <= 8
            ? 1.5
            : age >= 9 && age <= 13
              ? sex
                ? 1.9
                : 1.6
              : age >= 14 && age <= 18
                ? sex
                  ? 2.2
                  : 1.6
                : sex
                  ? 2.3
                  : 1.8,
      unit: 'mg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(Manganese);
    const Selenium = {
      name: 'Selenium',
      amount:
        age >= 1 && age <= 3
          ? 20
          : age >= 4 && age <= 8
            ? 30
            : age >= 9 && age <= 13
              ? 40
              : 55,
      unit: 'µg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(Selenium);
    const Chloride = {
      name: 'Chloride',
      amount:
        age >= 1 && age <= 3
          ? 1500
          : age >= 4 && age <= 8
            ? 1900
            : age >= 9 && age <= 70
              ? 2300
              : age >= 51 && age <= 70
                ? 2000
                : 1800,
      unit: 'mg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(Chloride);
    const Fluoride = {
      name: 'Fluoride',
      amount:
        age >= 0 && age <= 0.5
          ? 0.01
          : age > 0.5 && age <= 1
            ? 0.5
            : age >= 1 && age <= 3
              ? 0.7
              : age >= 4 && age <= 8
                ? 1.0
                : age >= 9 && age <= 13
                  ? 2.0
                  : age >= 14 && age <= 18
                    ? 3.0
                    : age >= 19 && sex
                      ? 4.0
                      : 3.0,
      unit: 'mg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(Fluoride);
    const Phosphorus = {
      name: 'Phosphorus',
      amount:
        age >= 0 && age <= 0.5
          ? 100
          : age > 0.5 && age <= 1
            ? 275
            : age >= 1 && age <= 3
              ? 460
              : age >= 4 && age <= 8
                ? 500
                : age >= 9 && age <= 18
                  ? 1250
                  : 700,
      unit: 'mg',
      percentOfDailyNeeds: 100,
    };
    nutrient.push(Phosphorus);
    console.log(nutrient);
    return nutrient;
  }

  async changeByUser(userId, input: UsersGoalsUpdateByUser) {
    const { changedNutrientName, newAmount } = input;
    const userGoal = await this.userGoalsRepository.findOne({
      where: { userId },
    });
    if (!userGoal)
      throw new HttpException('does not exists', HttpStatus.BAD_REQUEST);
    const { id: userGoalId, TDEE } = userGoal;
    const nutrient = await this.nutrientsRepository.find({
      where: { objectId: userGoalId, type: Type.USER_GOALS },
    });
    await this.updateChangeByUser(
      userGoalId,
      nutrient,
      changedNutrientName,
      newAmount,
      TDEE,
    );
  }
  async updateChangeByUser(
    id: number,
    nutrient,
    changedNutrientName,
    newAmount,
    TDEE,
  ) {
    const userGoal = await this.userGoalsRepository.findOne({
      where: { id },
    });
    if (!userGoal)
      throw new HttpException('does not exists', HttpStatus.BAD_REQUEST);
    await this.nutrientsRepository.delete({
      objectId: id,
      type: Type.USER_GOALS,
    });
    const nutrients = await this.adjustNutrients(
      TDEE,
      nutrient,
      changedNutrientName,
      newAmount,
    );
    await this.nutrientsRepository.save(
      this.nutrientsRepository.create({
        ...nutrients,
        objectId: id,
        type: Type.USER_GOALS,
      }),
    );
  }
  async adjustNutrients(TDEE, nutrient, changedNutrientName, newAmount) {
    // Tính lượng calo của thành phần cần thay đổi
    const changedCalories = newAmount * (changedNutrientName === 'Fat' ? 9 : 4); // Mỗi gram protein và carb cung cấp 4 calo, mỗi gram fat cung cấp 9 calo

    // Tính tổng lượng calo của hai thành phần còn lại
    const remainingCalories = TDEE - changedCalories;

    // Tính tỷ lệ phần trăm calo của hai thành phần còn lại
    let ratio1 = 0;
    let ratio2 = 0;
    nutrient.forEach((nutrientItem) => {
      if (nutrientItem.name !== changedNutrientName) {
        const caloriePerGram = nutrientItem.name === 'Fat' ? 9 : 4;
        ratio1 = (nutrientItem.amount * caloriePerGram) / remainingCalories;
        ratio2 = 1 - ratio1;
      }
    });

    // Tính lượng calo và đổi thành gram của hai thành phần còn lại
    const newAmount1 =
      (remainingCalories * ratio1) / (changedNutrientName === 'Fat' ? 9 : 4);
    const newAmount2 = (remainingCalories * ratio2) / 4;

    // Cập nhật lại lượng của hai thành phần còn lại
    nutrient.forEach((nutrientItem) => {
      if (nutrientItem.name !== changedNutrientName) {
        nutrientItem.amount =
          nutrientItem.name === 'Fat' ? newAmount1 : newAmount2;
      }
    });

    // Cập nhật lại lượng của thành phần cần thay đổi
    nutrient.forEach((nutrientItem) => {
      if (nutrientItem.name === changedNutrientName) {
        nutrientItem.amount = newAmount;
      }
    });

    return nutrient;
  }
  async update(id: number, input: UsersGoalsUpdate) {
    const userGoal = await this.userGoalsRepository.findOne({
      where: { id },
    });
    if (!userGoal)
      throw new HttpException('does not exists', HttpStatus.BAD_REQUEST);
    await this.nutrientsRepository.delete({
      objectId: id,
      type: Type.USER_GOALS,
    });
    const { BMR, BMI, TEE, TDEE } = await this.calculator(input);
    const nutrients = await this.createDataNutrients(input, TDEE);
    await this.nutrientsRepository.save(
      this.nutrientsRepository.create({
        ...nutrients,
        objectId: id,
        type: Type.USER_GOALS,
      }),
    );
    return await this.userGoalsRepository.save(
      this.userGoalsRepository.create({
        ...userGoal,
        ...input,
        BMR,
        BMI,
        TEE,
        TDEE,
      }),
    );
  }
  async updateCondition(id: number, input: UsersGoalsUpdateCondition) {
    const { conditionIds } = input;
    const userGoal = await this.userGoalsRepository.findOne({
      where: { id },
    });
    if (!userGoal)
      throw new HttpException('does not exists', HttpStatus.BAD_REQUEST);
    await this.nutrientsRepository.delete({
      objectId: id,
      type: Type.USER_GOALS,
    });
    const { BMR, BMI, TEE } = await this.calculator(input);
    let { TDEE } = await this.calculator(input);
    let nutrients = await this.createDataNutrients(input, TDEE);
    for (const id of conditionIds) {
      ({ nutrients, TDEE } = await this.adjustNutrientsForCondition(
        nutrients,
        id,
        TDEE,
      ));
    }
    await this.nutrientsRepository.save(
      this.nutrientsRepository.create({
        ...nutrients,
        objectId: id,
        type: Type.USER_GOALS,
      }),
    );
    return await this.userGoalsRepository.save(
      this.userGoalsRepository.create({
        ...userGoal,
        ...input,
        BMR,
        BMI,
        TEE,
        TDEE,
      }),
    );
  }
  async adjustNutrientsForCondition(
    nutrients: any[],
    id: any,
    TDEE: any,
  ): Promise<{ nutrients: any[]; TDEE: any }> {
    console.log('id condition: ', id);
    switch (id) {
      case 5:
        let energy: number;
        let totalFiber: number;
        nutrients.map((nutrient) => {
          if (nutrient.name === 'Carbohydrates') {
            energy = nutrient.amount * 0.2;
            nutrient.amount *= 0.8;
          }
          if (nutrient.name === 'Fiber') {
            nutrient.amount *= 1.2;
            totalFiber = nutrient.amount;
          }
          return nutrient;
        });
        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Protein') {
            nutrient.amount += energy;
          }
          return nutrient;
        });

        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Carbohydrates') {
            const netCarbs = nutrient.amount - totalFiber;
            nutrients.push({
              name: 'Net Carbohydrates',
              amount: netCarbs,
              unit: 'g',
              percentOfDailyNeeds: 100,
            });
          }
          return nutrient;
        });
        console.log('chay den day ');
        console.log(nutrients);
        return { nutrients, TDEE };
      case 6:
        const heartFatReductionFactor = 0.7;
        const heartCholesterolReductionFactor = 0.7;
        const heartSodiumReductionFactor = 0.5;
        const heartFiberIncreaseFactor = 1.2;
        const heartOmega3Addition = 1000;
        let heartFatNotUser = 0;

        if (!nutrients.find((nutrient) => nutrient.name === 'Omega-3')) {
          nutrients.push({
            name: 'Omega-3',
            amount: 0,
            unit: 'mg',
            percentOfDailyNeeds: 100,
          });
        }

        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Fat') {
            heartFatNotUser = nutrient.amount * 0.3;
            nutrient.amount *= heartFatReductionFactor;
          }
          if (nutrient.name === 'Cholesterol') {
            nutrient.amount *= heartCholesterolReductionFactor;
          }
          if (nutrient.name === 'Sodium') {
            nutrient.amount *= heartSodiumReductionFactor;
          }
          if (nutrient.name === 'Fiber') {
            nutrient.amount *= heartFiberIncreaseFactor;
          }
          if (nutrient.name === 'Omega-3') {
            nutrient.amount += heartOmega3Addition;
          }
          return nutrient;
        });
        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Protein') {
            nutrient.amount += heartFatNotUser;
          }
          return nutrient;
        });
        return { nutrients, TDEE };
      case 7:
        const kidneyProteinReductionFactor = 0.7;
        const kidneyPotassiumReductionFactor = 0.7;
        const kidneyPhosphorusReductionFactor = 0.7;
        const kidneySodiumReductionFactorKidney = 0.5;
        let kidneyProtein = 0;
        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Protein') {
            kidneyProtein = nutrient.amount * 0.3;
            nutrient.amount *= kidneyProteinReductionFactor;
          }
          if (nutrient.name === 'Potassium') {
            nutrient.amount *= kidneyPotassiumReductionFactor;
          }
          if (nutrient.name === 'Phosphorus') {
            nutrient.amount *= kidneyPhosphorusReductionFactor;
          }
          if (nutrient.name === 'Sodium') {
            nutrient.amount *= kidneySodiumReductionFactorKidney;
          }
          return nutrient;
        });
        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Carbohydrates') {
            nutrient.amount += kidneyProtein;
          }
          return nutrient;
        });
        return { nutrients, TDEE };
      case 8:
        let liverProtein = 0;
        const proteinReductionFactorLiver = 0.8;
        const fatReductionFactor = 0.7;
        const sodiumReductionFactorLiver = 0.5;

        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Protein') {
            liverProtein = nutrient.amount * 0.2;
            nutrient.amount *= proteinReductionFactorLiver;
          }
          if (nutrient.name === 'Fat') {
            nutrient.amount *= fatReductionFactor;
          }
          if (nutrient.name === 'Sodium') {
            nutrient.amount *= sodiumReductionFactorLiver;
          }
          return nutrient;
        });
        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Carbohydrates') {
            nutrient.amount += liverProtein;
          }
          return nutrient;
        });
        return { nutrients, TDEE };
      case 9:
        const cancerCalorieIncreaseFactor = 1.15;
        const extraCalories = TDEE * (cancerCalorieIncreaseFactor - 1);
        const extraProteinGrams = extraCalories / 4;
        TDEE = TDEE * 1.15;
        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Protein') {
            nutrient.amount += extraProteinGrams;
          }
          return nutrient;
        });

        return { nutrients, TDEE };
      case 10:
        const calciumIncrease = 1200;
        const vitaminDIncrease = 800;
        let proteinAdjustment = 0;
        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Calcium') {
            nutrient.amount = Math.max(calciumIncrease, nutrient.amount); // Đảm bảo ít nhất là 1200 mg/ngày
          }
          if (nutrient.name === 'Vitamin D') {
            nutrient.amount = Math.max(vitaminDIncrease, nutrient.amount); // Đảm bảo ít nhất là 800 IU/ngày
          }
          if (nutrient.name === 'Protein') {
            proteinAdjustment = nutrient.amount * 0.1;
            nutrient.amount += proteinAdjustment;
          }
          return nutrient;
        });
        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Carbohydrates') {
            nutrient.amount -= proteinAdjustment;
          }
          return nutrient;
        });
        return { nutrients, TDEE };
      case 11:
        const calciumRecommendedIntake = 1000; // Khuyến nghị lượng canxi
        const vitaminDRecommendedIntake = 600; // Khuyến nghị lượng vitamin D
        let proteinAdjustmentCeliac = 0;

        // Đảm bảo lượng canxi và vitamin D đạt mức khuyến nghị
        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Calcium') {
            nutrient.amount = Math.max(
              calciumRecommendedIntake,
              nutrient.amount,
            );
          }
          if (nutrient.name === 'Vitamin D') {
            nutrient.amount = Math.max(
              vitaminDRecommendedIntake,
              nutrient.amount,
            );
          }
          return nutrient;
        });

        // Tăng lượng protein
        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Protein') {
            proteinAdjustmentCeliac = nutrient.amount * 0.1; // Tăng 10% lượng protein
            nutrient.amount += proteinAdjustmentCeliac;
          }
          return nutrient;
        });

        // Giảm lượng carbohydrate để bù vào việc tăng protein
        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Carbohydrates') {
            nutrient.amount -= proteinAdjustmentCeliac;
          }
          return nutrient;
        });

        return { nutrients, TDEE };
      case 12:
        const proteinReductionGout = 0.2; // Giảm 20% lượng protein
        let proteinReductionAmountGout = 0;

        // Giảm lượng protein
        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Protein') {
            proteinReductionAmountGout = nutrient.amount * proteinReductionGout;
            nutrient.amount -= proteinReductionAmountGout;
          }
          return nutrient;
        });
        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Carbohydrates') {
            nutrient.amount -= proteinReductionAmountGout;
          }
          return nutrient;
        });

        return { nutrients, TDEE };
      case 13:
        const ironRecommendedIntake = 18;
        const vitaminCRecommendedIntake = 75;

        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Iron') {
            nutrient.amount = Math.max(ironRecommendedIntake, nutrient.amount);
          }
          if (nutrient.name === 'Vitamin B12') {
            nutrient.amount = Math.max(2.4, nutrient.amount);
          }
          if (nutrient.name === 'Vitamin C') {
            nutrient.amount = Math.max(
              vitaminCRecommendedIntake,
              nutrient.amount,
            );
          }
          return nutrient;
        });

        return { nutrients, TDEE };
      case 14:
        // Các điều chỉnh dinh dưỡng dựa trên khuyến nghị của các tổ chức y tế
        const calciumRecommendedIntakeRA = 1200; // Khuyến nghị lượng canxi
        const vitaminDRecommendedIntakeRA = 800; // Khuyến nghị lượng vitamin D
        const omega3AdditionRAarthritis = 1000;

        // Đảm bảo lượng canxi và vitamin D đạt mức khuyến nghị
        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Calcium') {
            nutrient.amount = Math.max(
              calciumRecommendedIntakeRA,
              nutrient.amount,
            );
          }
          if (nutrient.name === 'Vitamin D') {
            nutrient.amount = Math.max(
              vitaminDRecommendedIntakeRA,
              nutrient.amount,
            );
          }
          return nutrient;
        });
        if (!nutrients.find((nutrient) => nutrient.name === 'Omega-3')) {
          nutrients.push({
            name: 'Omega-3',
            amount: 0,
            unit: 'mg',
            percentOfDailyNeeds: 100,
          });
        }
        // Bổ sung omega-3
        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Omega-3') {
            nutrient.amount += omega3AdditionRAarthritis;
          }
          return nutrient;
        });

        return { nutrients, TDEE };
      case 15:
        const vitaminDRecommendedIntakeIBD = 800;
        const ironRecommendedIntakeIBD = 18;

        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Vitamin D') {
            nutrient.amount = Math.max(
              vitaminDRecommendedIntakeIBD,
              nutrient.amount,
            );
          }
          if (nutrient.name === 'Iron') {
            nutrient.amount = Math.max(
              ironRecommendedIntakeIBD,
              nutrient.amount,
            );
          }
          return nutrient;
        });
        return { nutrients, TDEE };

      case 16:
        const vitaminCRecommendedIntakeCOPD = 90;
        const vitaminERecommendedIntakeCOPD = 15;

        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Vitamin C') {
            nutrient.amount = Math.max(
              vitaminCRecommendedIntakeCOPD,
              nutrient.amount,
            );
          }
          if (nutrient.name === 'Vitamin E') {
            nutrient.amount = Math.max(
              vitaminERecommendedIntakeCOPD,
              nutrient.amount,
            );
          }
          return nutrient;
        });
        return { nutrients, TDEE };

      case 17:
        const fiberRecommendedIntakeParkinson = 30;
        const vitaminB6RecommendedIntakeParkinson = 1.7;

        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Fiber') {
            nutrient.amount = Math.max(
              fiberRecommendedIntakeParkinson,
              nutrient.amount,
            );
          }
          if (nutrient.name === 'Vitamin B6') {
            nutrient.amount = Math.max(
              vitaminB6RecommendedIntakeParkinson,
              nutrient.amount,
            );
          }
          return nutrient;
        });
        return { nutrients, TDEE };

      case 18:
        console.log('chay den day');
        const vitaminERecommendedIntakeAlzheimer = 15;
        const vitaminCRecommendedIntakeAlzheimer = 90;
        const omega3AdditionAlzheimer = 1000;

        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Vitamin E') {
            nutrient.amount = Math.max(
              vitaminERecommendedIntakeAlzheimer,
              nutrient.amount,
            );
          }
          if (nutrient.name === 'Vitamin C') {
            nutrient.amount = Math.max(
              vitaminCRecommendedIntakeAlzheimer,
              nutrient.amount,
            );
          }
          return nutrient;
        });

        if (!nutrients.find((nutrient) => nutrient.name === 'Omega-3')) {
          nutrients.push({
            name: 'Omega-3',
            amount: 0,
            unit: 'mg',
            percentOfDailyNeeds: 100,
          });
        }

        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Omega-3') {
            nutrient.amount += omega3AdditionAlzheimer;
          }
          return nutrient;
        });
        return { nutrients, TDEE };

      case 19:
        const vitaminARecommendedIntakePUD = 900;
        const zincRecommendedIntakePUD = 11;

        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Vitamin A') {
            nutrient.amount = Math.max(
              vitaminARecommendedIntakePUD,
              nutrient.amount,
            );
          }
          if (nutrient.name === 'Zinc') {
            nutrient.amount = Math.max(
              zincRecommendedIntakePUD,
              nutrient.amount,
            );
          }
          return nutrient;
        });
        return { nutrients, TDEE };
      case 20:
        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Folate') {
            nutrient.amount = Math.max(600, nutrient.amount);
          }
          if (nutrient.name === 'Iron') {
            nutrient.amount = Math.max(27, nutrient.amount);
          }
          if (nutrient.name === 'Calcium') {
            nutrient.amount = Math.max(1000, nutrient.amount);
          }
          if (nutrient.name === 'Zinc') {
            nutrient.amount = Math.max(11, nutrient.amount);
          }
          if (nutrient.name === 'VitaminA') {
            nutrient.amount = Math.max(770, nutrient.amount);
          }
          if (nutrient.name === 'VitaminD') {
            nutrient.amount = Math.max(15, nutrient.amount);
          }
          if (nutrient.name === 'VitaminB6') {
            nutrient.amount = Math.max(1.9, nutrient.amount);
          }
          if (nutrient.name === 'VitaminB12') {
            nutrient.amount = Math.max(2.6, nutrient.amount);
          }
          if (nutrient.name === 'VitaminC ') {
            nutrient.amount = Math.max(85, nutrient.amount);
          }
          if (nutrient.name === 'Protein') {
            nutrient.amount = (TDEE * 0.25) / 4;
          }
          if (nutrient.name === 'Carbohydrates') {
            nutrient.amount = (TDEE * 0.5) / 4;
          }
          if (nutrient.name === 'Fat') {
            nutrient.amount = (TDEE * 0.25) / 9;
          }
          return nutrient;
        });
        return { nutrients, TDEE };

      case 21:
        const folateRecommendedIntakeSecondTrimester = 600;
        const ironRecommendedIntakeSecondTrimester = 27;
        const calciumRecommendedIntakeSecondTrimester = 1000;
        const pregnancySecondVitaminA = 770;
        TDEE += 340;
        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Folate') {
            nutrient.amount = Math.max(
              folateRecommendedIntakeSecondTrimester,
              nutrient.amount,
            );
          }
          if (nutrient.name === 'Iron') {
            nutrient.amount = Math.max(
              ironRecommendedIntakeSecondTrimester,
              nutrient.amount,
            );
          }
          if (nutrient.name === 'Calcium') {
            nutrient.amount = Math.max(
              calciumRecommendedIntakeSecondTrimester,
              nutrient.amount,
            );
          }
          if (nutrient.name === 'Zinc') {
            nutrient.amount = Math.max(11, nutrient.amount);
          }
          if (nutrient.name === 'VitaminA') {
            nutrient.amount = Math.max(
              pregnancySecondVitaminA,
              nutrient.amount,
            );
          }
          if (nutrient.name === 'VitaminD') {
            nutrient.amount = Math.max(15, nutrient.amount);
          }
          if (nutrient.name === 'VitaminB6') {
            nutrient.amount = Math.max(1.9, nutrient.amount);
          }
          if (nutrient.name === 'VitaminB12') {
            nutrient.amount = Math.max(2.6, nutrient.amount);
          }
          if (nutrient.name === 'VitaminC ') {
            nutrient.amount = Math.max(85, nutrient.amount);
          }
          if (nutrient.name === 'Protein') {
            nutrient.amount = (TDEE * 0.25) / 4;
          }
          if (nutrient.name === 'Carbohydrates') {
            nutrient.amount = (TDEE * 0.5) / 4;
          }
          if (nutrient.name === 'Fat') {
            nutrient.amount = (TDEE * 0.25) / 9;
          }
          return nutrient;
        });
        return { nutrients, TDEE };

      case 22:
        TDEE += 452;
        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Folate') {
            nutrient.amount = Math.max(600, nutrient.amount);
          }
          if (nutrient.name === 'Iron') {
            nutrient.amount = Math.max(27, nutrient.amount);
          }
          if (nutrient.name === 'Calcium') {
            nutrient.amount = Math.max(1000, nutrient.amount);
          }
          if (nutrient.name === 'Zinc') {
            nutrient.amount = Math.max(11, nutrient.amount);
          }
          if (nutrient.name === 'VitaminA') {
            nutrient.amount = Math.max(770, nutrient.amount);
          }
          if (nutrient.name === 'VitaminD') {
            nutrient.amount = Math.max(15, nutrient.amount);
          }
          if (nutrient.name === 'VitaminB6') {
            nutrient.amount = Math.max(1.9, nutrient.amount);
          }
          if (nutrient.name === 'VitaminB12') {
            nutrient.amount = Math.max(2.6, nutrient.amount);
          }
          if (nutrient.name === 'VitaminC ') {
            nutrient.amount = Math.max(85, nutrient.amount);
          }
          if (nutrient.name === 'Protein') {
            nutrient.amount = (TDEE * 0.25) / 4;
          }
          if (nutrient.name === 'Carbohydrates') {
            nutrient.amount = (TDEE * 0.5) / 4;
          }
          if (nutrient.name === 'Fat') {
            nutrient.amount = (TDEE * 0.25) / 9;
          }
          return nutrient;
        });
        return { nutrients, TDEE };
      case 23:
        TDEE += 500;
        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Folate') {
            nutrient.amount = Math.max(500, nutrient.amount);
          }
          if (nutrient.name === 'Iron') {
            nutrient.amount = Math.max(9, nutrient.amount);
          }
          if (nutrient.name === 'Calcium') {
            nutrient.amount = Math.max(1000, nutrient.amount);
          }
          if (nutrient.name === 'Zinc') {
            nutrient.amount = Math.max(12, nutrient.amount);
          }
          if (nutrient.name === 'VitaminA') {
            nutrient.amount = Math.max(1300, nutrient.amount);
          }
          if (nutrient.name === 'VitaminD') {
            nutrient.amount = Math.max(15, nutrient.amount);
          }
          if (nutrient.name === 'VitaminB6') {
            nutrient.amount = Math.max(2, nutrient.amount);
          }
          if (nutrient.name === 'VitaminB12') {
            nutrient.amount = Math.max(2.8, nutrient.amount);
          }
          if (nutrient.name === 'VitaminC ') {
            nutrient.amount = Math.max(120, nutrient.amount);
          }
          if (nutrient.name === 'VitaminE ') {
            nutrient.amount = Math.max(19, nutrient.amount);
          }
          if (nutrient.name === 'Selenium ') {
            nutrient.amount = Math.max(70, nutrient.amount);
          }
          if (nutrient.name === 'Protein') {
            nutrient.amount = (TDEE * 0.25) / 4;
          }
          if (nutrient.name === 'Carbohydrates') {
            nutrient.amount = (TDEE * 0.5) / 4;
          }
          if (nutrient.name === 'Fat') {
            nutrient.amount = (TDEE * 0.25) / 9;
          }
          return nutrient;
        });
        return { nutrients, TDEE };

      case 24:
        const vitaminERecommendedIntakeHepB = 15;
        const vitaminCRecommendedIntakeHepB = 90;

        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Vitamin E') {
            nutrient.amount = Math.max(
              vitaminERecommendedIntakeHepB,
              nutrient.amount,
            );
          }
          if (nutrient.name === 'Vitamin C') {
            nutrient.amount = Math.max(
              vitaminCRecommendedIntakeHepB,
              nutrient.amount,
            );
          }
          return nutrient;
        });
        return { nutrients, TDEE };

      case 25:
        const vitaminERecommendedIntakeHepC = 15;
        const vitaminCRecommendedIntakeHepC = 90;

        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Vitamin E') {
            nutrient.amount = Math.max(
              vitaminERecommendedIntakeHepC,
              nutrient.amount,
            );
          }
          if (nutrient.name === 'Vitamin C') {
            nutrient.amount = Math.max(
              vitaminCRecommendedIntakeHepC,
              nutrient.amount,
            );
          }
          return nutrient;
        });
        return { nutrients, TDEE };

      case 26:
        const vitaminKRecommendedIntakeCirrhosis = 120;
        const vitaminDRecommendedIntakeCirrhosis = 800;

        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Vitamin K') {
            nutrient.amount = Math.max(
              vitaminKRecommendedIntakeCirrhosis,
              nutrient.amount,
            );
          }
          if (nutrient.name === 'Vitamin D') {
            nutrient.amount = Math.max(
              vitaminDRecommendedIntakeCirrhosis,
              nutrient.amount,
            );
          }
          return nutrient;
        });
        return { nutrients, TDEE };

      case 27:
        const calciumRecommendedIntakeHyperthyroid = 1200;
        const vitaminDRecommendedIntakeHyperthyroid = 800;

        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Calcium') {
            nutrient.amount = Math.max(
              calciumRecommendedIntakeHyperthyroid,
              nutrient.amount,
            );
          }
          if (nutrient.name === 'Vitamin D') {
            nutrient.amount = Math.max(
              vitaminDRecommendedIntakeHyperthyroid,
              nutrient.amount,
            );
          }
          return nutrient;
        });
        return { nutrients, TDEE };

      case 28:
        const vitaminDRecommendedIntakeMS = 800;
        const omega3AdditionMS = 1000;

        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Vitamin D') {
            nutrient.amount = Math.max(
              vitaminDRecommendedIntakeMS,
              nutrient.amount,
            );
          }
          return nutrient;
        });

        if (!nutrients.find((nutrient) => nutrient.name === 'Omega-3')) {
          nutrients.push({
            name: 'Omega-3',
            amount: 0,
            unit: 'mg',
            percentOfDailyNeeds: 100,
          });
        }

        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Omega-3') {
            nutrient.amount += omega3AdditionMS;
          }
          return nutrient;
        });
        return { nutrients, TDEE };

      case 29:
        const vitaminARecommendedIntakePancreatitis = 900;
        const vitaminCRecommendedIntakePancreatitis = 90;

        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Vitamin A') {
            nutrient.amount = Math.max(
              vitaminARecommendedIntakePancreatitis,
              nutrient.amount,
            );
          }
          if (nutrient.name === 'Vitamin C') {
            nutrient.amount = Math.max(
              vitaminCRecommendedIntakePancreatitis,
              nutrient.amount,
            );
          }
          return nutrient;
        });
        return { nutrients, TDEE };

      case 30:
        const calciumRecommendedIntakeOsteoporosis = 1200;
        const vitaminDRecommendedIntakeOsteoporosis = 800;

        nutrients = nutrients.map((nutrient) => {
          if (nutrient.name === 'Calcium') {
            nutrient.amount = Math.max(
              calciumRecommendedIntakeOsteoporosis,
              nutrient.amount,
            );
          }
          if (nutrient.name === 'Vitamin D') {
            nutrient.amount = Math.max(
              vitaminDRecommendedIntakeOsteoporosis,
              nutrient.amount,
            );
          }
          return nutrient;
        });
        return { nutrients, TDEE };
      // case 'hypertension':
      //   return nutrients.map((nutrient) => {
      //     if (nutrient.name === 'Sodium') {
      //       nutrient.amount *= 0.5;
      //     }
      //     if (nutrient.name === 'Potassium') {
      //       nutrient.amount *= 1.2;
      //     }
      //     return nutrient;
      //   });
      // case 'obesity':
      //   return nutrients.map((nutrient) => {
      //     if (nutrient.name === 'Fat') {
      //       nutrient.amount *= 0.7; // Giảm lượng chất béo
      //     }
      //     return { nutrients, TDEE };
      //   });
      // Thêm các case cho các loại bệnh khác
      default:
        return { nutrients, TDEE };
    }
  }
  async delete(input: UserGoalsDeleteDTO) {
    const { id: ids } = input;
    if (ids?.length > 0) {
      await this.userGoalsRepository.delete({ id: In(ids) });
      await this.nutrientsRepository.delete({
        objectId: In(ids),
        type: Type.USER_GOALS,
      });
      return new HttpException('deleted', HttpStatus.GONE);
    }
  }
}
