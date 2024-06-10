import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
//import { BullModule } from '@nestjs/bull';
//import { EmailConsumer } from './sendmail';
import { ConditionsController } from './condition.controller';
import { ConditionsService } from 'src/service/conditions.service';
import { Conditions } from 'src/entity/Conditions';
import { Users } from 'src/entity/Users';
import { Dished } from 'src/entity/Dished';
import { DishIngredients } from 'src/entity/DishIngredients';
import { Ingredients } from 'src/entity/Ingredients';
import { Meals } from 'src/entity/Meal';
import { MealRecipe } from 'src/entity/MealRecipe';
import { userConditions } from 'src/entity/UserConditions';
import { UserGoals } from 'src/entity/UserGoals';
import { Nutrients } from 'src/entity/Nutrients';
import { WeightPerServing } from 'src/entity/WeightPerServing';
import { Flavonoids } from 'src/entity/flavonoids';
import { Properties } from 'src/entity/properties';
@Module({
  controllers: [ConditionsController],
  providers: [ConditionsService],
  imports: [
    TypeOrmModule.forFeature([
      Users,
      Dished,
      DishIngredients,
      Ingredients,
      Meals,
      MealRecipe,
      userConditions,
      Nutrients,
      WeightPerServing,
      Flavonoids,
      Properties,
      UserGoals,
      Conditions,
    ]),
    ConfigModule,
    //BullModule.registerQueue({ name: 'send-mail' }),
  ],
})
export class ConditionModule {}
