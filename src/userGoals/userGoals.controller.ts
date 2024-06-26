import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/jwt.guard';
import { UserGoalsService } from 'src/service/userGoals.service';
import {
  UserGoalsCreateDTO,
  UserGoalsDeleteDTO,
  UserGoalsFilterDTO,
  UsersGoalsUpdate,
  UsersGoalsUpdateByUser,
  UsersGoalsUpdateByUserOld,
} from './dto/userGoals.dto';
import { NutritionDate } from 'src/meals/dto/meals.dto';

@Controller('userGoals')
export class UserGoalsController {
  constructor(private readonly userGoalsService: UserGoalsService) {}
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AuthGuard)
  @Post('/create')
  async create(@Body() input: UserGoalsCreateDTO) {
    return await this.userGoalsService.createOne(input);
  }
  @UseGuards(AuthGuard)
  @Get('/findOne/:id')
  async findOne(@Param('id') id: number) {
    return await this.userGoalsService.findOne(id);
  }
  @UseGuards(AuthGuard)
  @Get('/findOneByUser/:id')
  async findOneByUserId(@Param('id') id: number) {
    return await this.userGoalsService.findOneByUserId(id);
  }
  @UseGuards(AuthGuard)
  @Get('/findAll')
  async findAll(@Query() input: UserGoalsFilterDTO) {
    return await this.userGoalsService.findAll(input);
  }
  @UseGuards(AuthGuard)
  @Get('/get-nutrition-week')
  async getNutritionWeek(@Query() dateWeek: NutritionDate) {
    return await this.userGoalsService.calculateWeeklyNutrition(dateWeek);
  }
  @Patch('/update-by-user/:id')
  async changeByUser(
    @Param('id')
    id: number,
    @Body()
    input: UsersGoalsUpdateByUser,
  ) {
    return await this.userGoalsService.changeByUser(id, input);
  }
  // @Patch('/update-by-user-old')
  // async changeByUserOld(
  //   @Body()
  //   input: UsersGoalsUpdateByUserOld,
  // ) {
  //   return await this.userGoalsService.changeByUserOld(input);
  // }
  @UseGuards(AuthGuard)
  @Patch('/update/:id')
  async update(
    @Body()
    note: UsersGoalsUpdate,
    @Param('id')
    id: number,
  ) {
    return await this.userGoalsService.updateCondition(id, note);
  }
  @UseGuards(AuthGuard)
  @Delete('/delete')
  async delete(
    @Body()
    input: UserGoalsDeleteDTO,
  ) {
    return await this.userGoalsService.delete(input);
  }
}
