import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
//import { BullModule } from '@nestjs/bull';
//import { EmailConsumer } from './sendmail';
import { Dished } from 'src/entity/Dished';
import { MealsController } from './meals.controller';
import { MealService } from 'src/service/meal.service';
import { Meals } from 'src/entity/Meal';
import { MealRecipe } from 'src/entity/MealRecipe';
import { Users } from 'src/entity/Users';
import { DishIngredients } from 'src/entity/DishIngredients';
import { Ingredients } from 'src/entity/Ingredients';
import { userConditions } from 'src/entity/UserConditions';
import { UserGoals } from 'src/entity/UserGoals';
import { Conditions } from 'src/entity/Conditions';
import { Nutrients } from 'src/entity/Nutrients';
import { WeightPerServing } from 'src/entity/WeightPerServing';
import { Flavonoids } from 'src/entity/flavonoids';
import { Properties } from 'src/entity/properties';
import { TypeIntolerances } from 'src/entity/typeIntolerances';
import { Intolerances } from 'src/entity/intolerances';
@Module({
  controllers: [MealsController],
  providers: [MealService],
  imports: [
    TypeOrmModule.forFeature([
      Users,
      Dished,
      DishIngredients,
      Ingredients,
      Meals,
      MealRecipe,
      userConditions,
      UserGoals,
      Conditions,
      Nutrients,
      WeightPerServing,
      Flavonoids,
      Properties,
      TypeIntolerances,
      Intolerances,
    ]),
    ConfigModule,
    //BullModule.registerQueue({ name: 'send-mail' }),
  ],
})
export class MealsModule {}
