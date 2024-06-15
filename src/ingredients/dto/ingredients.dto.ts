export class IngredientsCreateDTO {
  name: string;

  calorie: number;

  protein: number;

  carbs: number;

  fat: number;
}
export const getSkip = ({ page, take }): number => {
  return (page - 1) * take;
};
export class IngredientsFilterDTO {
  name: string;
  page: number;
  take: number;
}

export class IngredientsDeleteDTO {
  id: string[];
}
