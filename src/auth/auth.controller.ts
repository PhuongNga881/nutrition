import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from 'src/service/auth.service';
import { AuthGuard } from 'src/guards/jwt.guard';
import { UserCreateDTO, UsersFilterDTO } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @UsePipes(new ValidationPipe({ transform: true }))
  @Post('/create')
  async create(@Body() account: UserCreateDTO) {
    return await this.authService.createOne(account);
  }
  @Post('/login')
  async Login(@Body() account: UserCreateDTO) {
    return await this.authService.Login(account);
  }
  @UseGuards(AuthGuard)
  @Get()
  async getAccount(
    @Request()
    req: any,
  ) {
    const { id } = req.user;
    return await this.authService.findOne(id);
  }
  @Get('/getOne/:id')
  async getOne(
    @Param('id')
    id: any,
  ) {
    return await this.authService.getOne(id);
  }
  @Get('/getAll')
  async getAll(
    @Query()
    input: UsersFilterDTO,
  ) {
    return await this.authService.findAll(input);
  }
}
