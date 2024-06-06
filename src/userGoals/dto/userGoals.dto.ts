import { CONDITION, EXERCISE } from 'src/enum/type.enum';

export class UserGoalsCreateDTO {
  userId: number;

  Description: string;

  sex: boolean;

  age: number;

  height: number;
  weight: number;
  exercise: EXERCISE;
  conditionNames: ConditionName[];
}
export class UsersGoalsUpdate extends UserGoalsCreateDTO {}
export class UsersGoalsUpdateCondition extends UserGoalsCreateDTO {
  conditionNames: ConditionName[];
}
export class ConditionName {
  Name: CONDITION;
}
export class UserGoalsFilterDTO {
  userId: number;
  exercise: string;
}

export class UserGoalsDeleteDTO {
  id: string[];
}
