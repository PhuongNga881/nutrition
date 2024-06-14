export class ConditionUpdateDTO {
  isActive: boolean;
}

export class ConditionFilterDTO {
  isActive: boolean;
  name: string;
}

export class ConditionDeleteDTO {
  id: string[];
}
