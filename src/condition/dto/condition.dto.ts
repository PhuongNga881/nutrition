export class ConditionUpdateDTO {
  isActive: boolean;
  name: string;
  name_vn: string;
  Description: string;
}

export class ConditionFilterDTO {
  isActive: boolean;
  name: string;
}

export class ConditionDeleteDTO {
  id: string[];
}
