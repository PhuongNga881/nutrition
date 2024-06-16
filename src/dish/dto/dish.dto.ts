export class DishCreateDTO {
  name: string;
  isAll: boolean;
  Description: string;
  UserId: number;
  ingredients: CreateIngredientDto[];
}
export class DishUpdateDTO extends DishCreateDTO {}
export class CreateIngredientDto {
  ingredientId: number;
  quantity: number;
}
export class DishFilterDTO {
  UserId: number;
  name: string;
  isAll: boolean;
  intolerances: string[];
}

export class DishDeleteDTO {
  id: string[];
}
