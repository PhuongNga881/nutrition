import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import 'dotenv/config';
import {
  UserCreateDTO,
  UserUpdateDTO,
  UsersDeleteDTO,
  UsersFilterDTO,
  getSkip,
} from 'src/auth/dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { Address } from '@nestjs-modules/mailer/dist/interfaces/send-mail-options.interface';
// import { InjectQueue } from '@nestjs/bull';
// import { Queue } from 'bull';
// import { Cron, CronExpression } from '@nestjs/schedule';
import { Users } from 'src/entity/Users';
import { userConditions } from 'src/entity/UserConditions';
import { Conditions } from 'src/entity/Conditions';
import { UserGoals } from 'src/entity/UserGoals';
// import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
// import * as cron from 'cron';
export type sendEmailDTO = {
  sender?: string | Address;
  recipients: string | Address[];
  subject: string;
  text: string;
  html: string;
};
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(userConditions)
    private userConditionsRepository: Repository<userConditions>,
    @InjectRepository(Conditions)
    private conditionsRepository: Repository<Conditions>,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(UserGoals)
    private userGoalsRepository: Repository<UserGoals>,
  ) {}
  hashPassword = async (password) => await bcrypt.hash(password, 10);
  async findOne(id: number) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new HttpException('user does not exists', HttpStatus.BAD_REQUEST);
    }
    return user;
  }
  async findAll(input: UsersFilterDTO) {
    const { take, page } = input;
    return await this.usersRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.goals', 'g')
      .leftJoinAndSelect('u.roles', 'r')
      .leftJoinAndSelect('u.dishes', 'd')
      .take(take)
      .skip(getSkip({ page, take }))
      .getMany();
  }
  async getOne(id: number) {
    return await this.usersRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.goals', 'g')
      .leftJoinAndSelect('u.roles', 'r')
      .leftJoinAndSelect('u.dishes', 'd')
      .where('i.id = :id', { id })
      .getOne();
  }
  async updateUser(id: number, input: UserUpdateDTO) {
    const { password, userName, oldPassword } = input;
    const user = await this.usersRepository.findOne({
      where: { id },
    });
    if (!user)
      throw new HttpException(
        'username does not exists',
        HttpStatus.BAD_REQUEST,
      );
    if (userName) {
      const checkUsername = await this.usersRepository.findOne({
        where: { id: Not(id), userName },
      });
      if (checkUsername)
        throw new HttpException(
          'username already exists',
          HttpStatus.BAD_REQUEST,
        );
    }
    if (password) {
      if (oldPassword) {
        const isMatch = await this.comparePasswords(password, user.password);
        if (!isMatch) {
          throw new HttpException(
            'Old password does not match',
            HttpStatus.BAD_REQUEST,
          );
        }
      } else {
        throw new HttpException(
          'You must be import old password',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    return await this.usersRepository.save({
      ...user,
      ...input,
      ...(password ? { password: await this.hashPassword(password) } : {}),
    });
  }
  async deletedUser(input: UsersDeleteDTO) {
    const { id: ids } = input;
    if (ids?.length > 0) {
      await this.usersRepository.delete(ids);
      await this.userGoalsRepository.delete({ userId: In(ids) });
      return new HttpException('deleted', HttpStatus.GONE);
    }
  }

  async createOne(user: UserCreateDTO) {
    const { userName, password } = user;
    const checkUsername = await this.usersRepository.findOne({
      where: { userName },
    });
    if (checkUsername)
      throw new HttpException(
        'username already exists',
        HttpStatus.BAD_REQUEST,
      );
    const UserSave = await this.usersRepository.save(
      this.usersRepository.create({
        ...user,
        userName,
        password: await this.hashPassword(password),
        roleId: 2,
      }),
    );
    const acc = {
      id: UserSave.id,
      username: UserSave.userName,
      email: UserSave.email,
    };
    const accessToken = await this.jwtService.signAsync(acc);
    // await this.sendmail.add(
    //   'register',
    //   {
    //     to: acc.email,
    //     username: acc.username,
    //   },
    //   { delay: 5000, removeOnComplete: true },
    // );
    return accessToken;
  }
  async Login(user: UserCreateDTO) {
    const { userName, password } = user;
    const checkUsername = await this.usersRepository.findOne({
      where: { userName },
    });
    if (!checkUsername)
      throw new HttpException(
        'username does not exists',
        HttpStatus.BAD_REQUEST,
      );
    const isMatch = await this.comparePasswords(
      password,
      checkUsername.password,
    );
    console.log(isMatch);
    if (!isMatch) {
      throw new HttpException(
        'password does not match',
        HttpStatus.BAD_REQUEST,
      );
    }
    const acc = {
      id: checkUsername.id,
      username: checkUsername.userName,
      password: checkUsername.password,
    };
    const accessToken = await this.jwtService.signAsync(acc);
    return accessToken;
  }
  async comparePasswords(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainTextPassword, hashedPassword);
  }
}
