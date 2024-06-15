import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThan, Repository } from 'typeorm';
import 'dotenv/config';
import { Ingredients } from 'src/entity/Ingredients';
import {
  IngredientsCreateDTO,
  IngredientsDeleteDTO,
  IngredientsFilterDTO,
  getSkip,
} from 'src/ingredients/dto/ingredients.dto';
import moment from 'moment';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { Nutrients } from 'src/entity/Nutrients';
import { Type } from 'src/enum/type.enum';
import { WeightPerServing } from 'src/entity/WeightPerServing';
import { CaloricBreakdown } from 'src/entity/CaloricBreakdown';
@Injectable()
export class IngredientsService {
  constructor(
    @InjectRepository(Ingredients)
    private ingredientsRepository: Repository<Ingredients>,
    @InjectRepository(Nutrients)
    private nutrientsRepository: Repository<Nutrients>,
    @InjectRepository(WeightPerServing)
    private weightPerServingRepository: Repository<WeightPerServing>,
    @InjectRepository(CaloricBreakdown)
    private caloricBreakdownRepository: Repository<CaloricBreakdown>,
    private readonly configService: ConfigService,
  ) {}

  async findOne(id: number) {
    const ingredient = await this.ingredientsRepository
      .createQueryBuilder('i')
      .leftJoinAndMapMany(
        'i.nutrients',
        Nutrients,
        'n',
        'i.id = n.objectId and n.type = :type',
        { type: Type.INGREDIENTS },
      )
      .leftJoinAndMapMany(
        'i.weightPerServing',
        WeightPerServing,
        'w',
        'i.id = w.objectId and w.type = :type',
        { type: Type.INGREDIENTS },
      )
      .leftJoinAndMapMany(
        'i.caloricBreakdown',
        CaloricBreakdown,
        'c',
        'i.id = c.objectId and c.type = :type',
        { type: Type.INGREDIENTS },
      )
      .where('i.id = :id and deleteAt is NULL', { id: id })
      .getOne();
    if (!ingredient)
      throw new HttpException('does not exists', HttpStatus.BAD_REQUEST);
    return ingredient;
  }
  async findAll(input: IngredientsFilterDTO) {
    const { name, take, page } = input;
    const ingredient = await this.ingredientsRepository
      .createQueryBuilder('i')
      .leftJoinAndMapMany(
        'i.caloricBreakdown',
        CaloricBreakdown,
        'c',
        'i.id = c.objectId and c.type = :type',
        { type: Type.INGREDIENTS },
      )
      .leftJoinAndMapMany(
        'i.weightPerServing',
        WeightPerServing,
        'w',
        'i.id = w.objectId and w.type = :type',
        { type: Type.INGREDIENTS },
      )
      .leftJoinAndMapMany(
        'i.nutrients',
        Nutrients,
        'n',
        'i.id = n.objectId and n.type = :type',
        { type: Type.INGREDIENTS },
      )
      .where(
        `deleteAt is NULL ${name ? 'and LOWER(i.name) like  :name' : ''}`,
        {
          ...(name ? { name: `%${name.toLowerCase()}%` } : {}),
        },
      )
      .take(take)
      .skip(getSkip({ page, take }))
      .getMany();
    return ingredient;
  }
  async createOne(input: IngredientsCreateDTO) {
    return await this.ingredientsRepository.save(
      this.ingredientsRepository.create({ ...input }),
    );
  }
  async getData() {
    const ingredients = await this.ingredientsRepository.find({
      select: ['code', 'id'],
      where: { id: MoreThan(722) },
    });
    const apiKey = this.configService.get<string>('API_KEY');
    if (ingredients.length > 0) {
      for (let i = 0; i < 150; i++) {
        const { code, id: ingredientId } = ingredients[i];
        console.log(code);
        const url = `https://api.spoonacular.com/food/ingredients/${code}/information?apiKey=${apiKey}&amount=100&unit=grams`;
        const data = await axios.get(url);
        const { id, original, originalName, image, nutrition } = data?.data;
        await this.ingredientsRepository
          .createQueryBuilder()
          .update(Ingredients)
          .set({ original, originalName, image })
          .where('code = :id', { id })
          .execute();
        const { nutrients, caloricBreakdown, weightPerServing } = nutrition;
        if (nutrients.length > 0) {
          for (const nutrient of nutrients) {
            await this.nutrientsRepository.save(
              this.nutrientsRepository.create({
                ...nutrient,
                objectId: ingredientId,
                type: Type.INGREDIENTS,
              }),
            );
          }
        }
        console.log(caloricBreakdown);
        if (caloricBreakdown) {
          await this.caloricBreakdownRepository.save(
            this.caloricBreakdownRepository.create({
              ...caloricBreakdown,
              objectId: ingredientId,
              type: Type.INGREDIENTS,
            }),
          );
        }
        console.log(weightPerServing);
        if (weightPerServing) {
          await this.weightPerServingRepository.save(
            this.weightPerServingRepository.create({
              ...weightPerServing,
              objectId: ingredientId,
              type: Type.INGREDIENTS,
            }),
          );
        }
        const requestPoints = data.headers['x-api-quota-request'];
        const totalPointsUsed = data.headers['x-api-quota-used'];

        console.log(`Points used by the request: ${requestPoints}`);
        console.log(`Total points used today: ${totalPointsUsed}`);
      }
    }
    // const apiKey = this.configService.get<string>('API_KEY');
    // const url = `https://api.spoonacular.com/food/ingredients/9266/information?apiKey=${apiKey}`;
    // const data = await axios.get(url);
    // return data?.data;
  }
  //   async createMany(note: NotesDTO[], workspaceId: number, accountId: number) {
  //     console.log(workspaceId);
  //     const Notes = note.map((n) => ({
  //       ...n,
  //       workspaceId: workspaceId,
  //     }));
  //     const checkId = this.checkIdAccount(accountId, workspaceId);
  //     if (!checkId)
  //       return new ResponseData(
  //         [],
  //         HttpStatus.BAD_REQUEST,
  //         HttpMessage.BAD_REQUEST,
  //       );

  //     const noteSave = await this.noteRepository
  //       .createQueryBuilder()
  //       .insert()
  //       .into(notes)
  //       .values(Notes)
  //       .execute();
  //     return new ResponseData(noteSave, HttpStatus.CREATED, HttpMessage.SUCCESS);
  //   }
  async update(id: number, input: IngredientsCreateDTO) {
    const ingredient = await this.ingredientsRepository.findOne({
      where: { id },
    });
    if (!ingredient)
      throw new HttpException('does not exists', HttpStatus.BAD_REQUEST);
    return await this.ingredientsRepository
      .createQueryBuilder()
      .update(Ingredients)
      .set(input)
      .where('id = :id', { id: id })
      .execute();
  }
  async delete(input: IngredientsDeleteDTO) {
    const { id: ids } = input;
    if (ids?.length > 0) {
      await this.ingredientsRepository.update(
        {
          id: In(ids),
        },
        {
          deletedAt: moment().format(),
        },
      );
    }
    return new HttpException('deleted', HttpStatus.GONE);
  }
}
