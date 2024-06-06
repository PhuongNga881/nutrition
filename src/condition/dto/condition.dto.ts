export class ConditionCreateDTO {
  name: string;

  Description: string;
  nutrition: CreateNutrition[];
}
export class CreateNutrition {
  name: string;
  amount: number;
  unit: string;
}
export class ConditionUpdateDTO extends ConditionCreateDTO {}

export class ConditionFilterDTO {
  userId: number;
  name: string;
}

export class ConditionDeleteDTO {
  id: string[];
}
