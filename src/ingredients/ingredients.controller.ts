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
import {
  IngredientsCreateDTO,
  IngredientsDeleteDTO,
  IngredientsFilterDTO,
} from './dto/ingredients.dto';
import { IngredientsService } from 'src/service/ingredients.service';

@Controller('ingredient')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AuthGuard)
  @Post('/create')
  async create(@Body() input: IngredientsCreateDTO) {
    return await this.ingredientsService.createOne(input);
  }
  @UseGuards(AuthGuard)
  @Get('/findOne/:id')
  async findOne(@Param('id') id: number) {
    return await this.ingredientsService.findOne(id);
  }
  @UseGuards(AuthGuard)
  @Get('/findAll')
  async findAll(@Query() input: IngredientsFilterDTO) {
    return await this.ingredientsService.findAll(input);
  }
  @Get('/getName')
  async getName() {
    return await this.ingredientsService.getName();
  }
  @Get('/data')
  async getData() {
    return await this.ingredientsService.getData();
  }
  @UseGuards(AuthGuard)
  @Patch('/update/:id')
  async update(
    @Body()
    note: IngredientsCreateDTO,
    @Param('id')
    id: number,
  ) {
    return await this.ingredientsService.update(id, note);
  }
  @UseGuards(AuthGuard)
  @Delete('/delete')
  async delete(
    @Body()
    input: IngredientsDeleteDTO,
  ) {
    return await this.ingredientsService.delete(input);
  }
}
