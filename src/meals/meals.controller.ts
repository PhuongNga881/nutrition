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
  MealCreateDTO,
  MealDeleteDTO,
  MealFilterDTO,
  MealUpdateDTO,
} from './dto/meals.dto';

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
  @Get('/get-nutrition-day/:ids')
  async getNutritionDay(@Param('id') id: number, @Body() day: string) {
    return await this.mealService.calculateDailyNutrition(id, day);
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
  @Delete('/delete')
  async delete(
    @Body()
    input: MealDeleteDTO,
  ) {
    return await this.mealService.delete(input);
  }
}
