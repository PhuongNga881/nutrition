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
import { DishedService } from 'src/service/dished.service';
import {
  DishCreateDTO,
  DishDeleteDTO,
  DishFilterDTO,
  DishUpdateDTO,
} from './dto/dish.dto';

@Controller('dishes')
export class DishesController {
  constructor(private readonly dishedService: DishedService) {}
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AuthGuard)
  @Post('/create')
  async create(
    @Body() input: DishCreateDTO,
    @Request()
    req: any,
  ) {
    const { id } = req.user;
    return await this.dishedService.createOne(input, id);
  }
  @UseGuards(AuthGuard)
  @Get('/findOne/:id')
  async findOne(@Param('id') id: number) {
    return await this.dishedService.findOne(id);
  }
  @UseGuards(AuthGuard)
  @Get('/findAll')
  async findAll(@Query() input: DishFilterDTO) {
    return await this.dishedService.findAll(input);
  }
  @UseGuards(AuthGuard)
  @Patch('/update/:id')
  async update(
    @Body()
    note: DishUpdateDTO,
    @Param('id')
    id: number,
  ) {
    return await this.dishedService.update(id, note);
  }
  @UseGuards(AuthGuard)
  @Delete('/delete')
  async delete(
    @Body()
    input: DishDeleteDTO,
  ) {
    return await this.dishedService.delete(input);
  }
}
