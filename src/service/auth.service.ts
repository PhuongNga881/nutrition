import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import 'dotenv/config';
import { UserCreateDTO } from 'src/auth/dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { Address } from '@nestjs-modules/mailer/dist/interfaces/send-mail-options.interface';
// import { InjectQueue } from '@nestjs/bull';
// import { Queue } from 'bull';
// import { Cron, CronExpression } from '@nestjs/schedule';
import { Users } from 'src/entity/Users';
import { userConditions } from 'src/entity/UserConditions';
import { Conditions } from 'src/entity/Conditions';
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
  ) {}
  hashPassword = async (password) => await bcrypt.hash(password, 10);
  async findOne(id: number) {
    return await this.usersRepository.findOne({ where: { id } });
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
    console.log(password);
    const UserSave = await this.usersRepository.save(
      this.usersRepository.create({
        ...user,
        userName,
        password: await this.hashPassword(password),
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
  async saveConditionInfo(conditions: any, userID: any) {
    for (const c of conditions) {
      const findDish = await this.conditionsRepository.findOne({
        where: { id: c.id },
      });
      if (findDish) {
        await this.userConditionsRepository.save(
          this.userConditionsRepository.create({
            ConditionID: findDish.id,
            userID,
          }),
        );
      }
    }
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
