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
import { ConditionsService } from 'src/service/conditions.service';
import {
  ConditionCreateDTO,
  ConditionDeleteDTO,
  ConditionFilterDTO,
  ConditionUpdateDTO,
} from './dto/condition.dto';

@Controller('conditions')
export class ConditionsController {
  constructor(private readonly conditionsService: ConditionsService) {}
  @UsePipes(new ValidationPipe({ transform: true }))
  // @UseGuards(AuthGuard)
  // @Post('/create')
  // async create(@Body() input: ConditionCreateDTO) {
  //   return await this.conditionsService.createOne(input);
  // }
  @UseGuards(AuthGuard)
  @Get('/findOne/:id')
  async findOne(@Param('id') id: number) {
    return await this.conditionsService.findOne(id);
  }
  @UseGuards(AuthGuard)
  @Get('/findAll')
  async findAll(@Query() input: ConditionFilterDTO) {
    return await this.conditionsService.findAll(input);
  }
  // @UseGuards(AuthGuard)
  // @Patch('/update/:id')
  // async update(
  //   @Body()
  //   note: ConditionUpdateDTO,
  //   @Param('id')
  //   id: number,
  // ) {
  //   return await this.conditionsService.update(id, note);
  // }
  // @UseGuards(AuthGuard)
  // @Delete('/delete')
  // async delete(
  //   @Body()
  //   input: ConditionDeleteDTO,
  // ) {
  //   return await this.conditionsService.delete(input);
  // }
}
