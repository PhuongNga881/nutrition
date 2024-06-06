export class IngredientsCreateDTO {
  name: string;

  calorie: number;

  protein: number;

  carbs: number;

  fat: number;
}

export class IngredientsFilterDTO {
  name: string;
}

export class IngredientsDeleteDTO {
  id: string[];
}
