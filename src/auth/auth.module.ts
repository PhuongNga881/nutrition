import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from 'src/service/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
//import { BullModule } from '@nestjs/bull';
//import { EmailConsumer } from './sendmail';
import { Users } from 'src/entity/Users';
import { Dished } from 'src/entity/Dished';
import { DishIngredients } from 'src/entity/DishIngredients';
import { Ingredients } from 'src/entity/Ingredients';
import { Meals } from 'src/entity/Meal';
import { MealRecipe } from 'src/entity/MealRecipe';
import { userConditions } from 'src/entity/UserConditions';
import { UserGoals } from 'src/entity/UserGoals';
import { Conditions } from 'src/entity/Conditions';
@Module({
  controllers: [AuthController],
  providers: [AuthService],
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
    ]),
    ConfigModule,
    //BullModule.registerQueue({ name: 'send-mail' }),
  ],
})
export class AuthModule {}
