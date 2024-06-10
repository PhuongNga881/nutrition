export class DishCreateDTO {
  name: string;
  isAll: boolean;
  Description: string;
  userId: number;
  ingredients: CreateIngredientDto[];
}
export class DishUpdateDTO extends DishCreateDTO {}
export class CreateIngredientDto {
  ingredientId: number;
  quantity: number;
}
export class DishFilterDTO {
  userId: number;
  name: string;
  isAll: boolean;
}

export class DishDeleteDTO {
  id: string[];
}
