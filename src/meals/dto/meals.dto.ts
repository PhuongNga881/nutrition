export class MealCreateDTO {
  name: string;

  Description: string;
  dishesRecipe: CreateDishDto[];
  dateMeal: Date;
}
export class MealUpdateDTO extends MealCreateDTO {}
export class CreateDishDto {
  Id: number;
  quantity: number;
}
export class MealFilterDTO {
  userId: number;
  name: string;
  dateMeal: Date;
}

export class MealDeleteDTO {
  id: string[];
}
