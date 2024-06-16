export class IngredientsCreateDTO {
  name: string;
  code: string;
  image: string;
  original: string;
  originalName: string;
  nutrition: CreateNutritionDTO[];
  weightPerServing: CreateWeightDTO;
}
export const getSkip = ({ page, take }): number => {
  return (page - 1) * take;
};
export class IngredientsFilterDTO {
  name: string;
  page: number;
  take: number;
}
export class CreateWeightDTO {
  amount: number;
  unit: string;
}
export class CreateNutritionDTO {
  name: string;
  amount: number;
  unit: string;
}
export class IngredientsDeleteDTO {
  id: string[];
}
