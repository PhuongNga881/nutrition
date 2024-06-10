import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
//import { BullModule } from '@nestjs/bull';
//import { EmailConsumer } from './sendmail';
import { DishesController } from './dish.controller';
import { DishedService } from 'src/service/dished.service';
import { Dished } from 'src/entity/Dished';
import { Ingredients } from 'src/entity/Ingredients';
import { DishIngredients } from 'src/entity/DishIngredients';
import { Users } from 'src/entity/Users';
import { Meals } from 'src/entity/Meal';
import { MealRecipe } from 'src/entity/MealRecipe';
import { userConditions } from 'src/entity/UserConditions';
import { UserGoals } from 'src/entity/UserGoals';
import { Conditions } from 'src/entity/Conditions';
import { Nutrients } from 'src/entity/Nutrients';
import { WeightPerServing } from 'src/entity/WeightPerServing';
import { Flavonoids } from 'src/entity/flavonoids';
import { Properties } from 'src/entity/properties';
@Module({
  controllers: [DishesController],
  providers: [DishedService],
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
    ]),
    ConfigModule,
    //BullModule.registerQueue({ name: 'send-mail' }),
  ],
})
export class DishesModule {}
