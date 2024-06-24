import { EXERCISE } from 'src/enum/type.enum';

export class UserGoalsCreateDTO {
  userId: number;

  Description: string;

  sex: boolean;

  age: number;

  height: number;
  weight: number;
  exercise: EXERCISE;
  conditionIds: number[];
}
export class UsersGoalsUpdate extends UserGoalsCreateDTO {}
export class UsersGoalsUpdateByUser {
  proteinAmount: number;
  carbohydratesAmount: number;
  fatAmount: number;
}
export class UsersGoalsUpdateByUserOld {
  id: number;
  changedNutrientName: string;
  newAmount: number;
}
export class UsersGoalsUpdateCondition extends UserGoalsCreateDTO {}
export class UserGoalsFilterDTO {
  userId: number;
  exercise: string;
}

export class UserGoalsDeleteDTO {
  id: string[];
}
