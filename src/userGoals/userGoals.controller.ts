import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
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
} from './dto/userGoals.dto';

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
  @Get('/findAll')
  async findAll(@Query() input: UserGoalsFilterDTO) {
    return await this.userGoalsService.findAll(input);
  }
  @Patch('/update-by-user')
  async changeByUser(
    @Req()
    req: any,
    @Body()
    input: UsersGoalsUpdateByUser,
  ) {
    const { id: userId } = req.user;
    return await this.userGoalsService.changeByUser(userId, input);
  }
  @UseGuards(AuthGuard)
  @Patch('/update/:id')
  async update(
    @Body()
    note: UsersGoalsUpdate,
    @Param('id')
    id: number,
  ) {
    return await this.userGoalsService.update(id, note);
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
