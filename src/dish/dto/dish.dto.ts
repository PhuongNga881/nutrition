export class DishCreateDTO {
  name: string;

  Description: string;
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
}

export class DishDeleteDTO {
  id: string[];
}
