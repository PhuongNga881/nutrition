import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
//import { BullModule } from '@nestjs/bull';
//import { EmailConsumer } from './sendmail';
import { Ingredients } from 'src/entity/Ingredients';
import { Users } from 'src/entity/Users';
import { Dished } from 'src/entity/Dished';
import { DishIngredients } from 'src/entity/DishIngredients';
import { Meals } from 'src/entity/Meal';
import { MealRecipe } from 'src/entity/MealRecipe';
import { userConditions } from 'src/entity/UserConditions';
import { UserGoals } from 'src/entity/UserGoals';
import { Conditions } from 'src/entity/Conditions';
import { Nutrients } from 'src/entity/Nutrients';
import { WeightPerServing } from 'src/entity/WeightPerServing';
import { CaloricBreakdown } from 'src/entity/CaloricBreakdown';
import { UserGoalsController } from './userGoals.controller';
import { UserGoalsService } from 'src/service/userGoals.service';
@Module({
  controllers: [UserGoalsController],
  providers: [UserGoalsService],
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
      CaloricBreakdown,
    ]),
    ConfigModule,
    //BullModule.registerQueue({ name: 'send-mail' }),
  ],
})
export class UserGoalsModule {}
