import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/jwt.guard';

import { MealService } from 'src/service/meal.service';
import {
  MealAddDishDTO,
  MealCreateDTO,
  MealDeleteDTO,
  MealFilterDTO,
  MealUpdateDTO,
  NutritionDate,
} from './dto/meals.dto';
import { start } from 'repl';

@Controller('meals')
export class MealsController {
  constructor(private readonly mealService: MealService) {}
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AuthGuard)
  @Post('/create')
  async create(
    @Body() input: MealCreateDTO,
    @Request()
    req: any,
  ) {
    const { id: userId } = req.user;
    return await this.mealService.createOne(input, userId);
  }
  @UseGuards(AuthGuard)
  @Get('/findOne/:id')
  async findOne(@Param('id') id: number) {
    return await this.mealService.findOne(id);
  }
  @UseGuards(AuthGuard)
  @Get('/findAll')
  async findAll(@Query() input: MealFilterDTO) {
    return await this.mealService.findAll(input);
  }
  @UseGuards(AuthGuard)
  @Post('/get-nutrition-day/:ids')
  async getNutritionDay(@Param('id') id: number, @Body() day: string) {
    return await this.mealService.calculateDailyNutrition(id, day);
  }
  @UseGuards(AuthGuard)
  @Get('/get-nutrition-week')
  async getNutritionWeek(@Query() dateWeek: NutritionDate) {
    return await this.mealService.calculateWeeklyNutrition(dateWeek);
  }
  @UseGuards(AuthGuard)
  @Get('/get-nutrition-month/:ids')
  async getNutritionMonth(@Param('id') id: number, @Body() month: string) {
    return await this.mealService.calculateMonthlyNutrition(id, month);
  }
  @UseGuards(AuthGuard)
  @Patch('/update/:id')
  async update(
    @Body()
    note: MealUpdateDTO,
    @Param('id')
    id: number,
  ) {
    return await this.mealService.update(id, note);
  }
  @UseGuards(AuthGuard)
  @Post('/add-dish/:id')
  async addDish(
    @Body()
    note: MealAddDishDTO,
    @Param('id')
    id: number,
  ) {
    return await this.mealService.addDish(id, note);
  }
  @UseGuards(AuthGuard)
  @Delete('/delete')
  async delete(
    @Body()
    input: MealDeleteDTO,
  ) {
    return await this.mealService.delete(input);
  }
}
