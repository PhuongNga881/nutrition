export class UserCreateDTO {
  userName: string;

  password: string;

  name: string;

  email: string;
  roleId: number;
}
export const getSkip = ({ page, take }): number => {
  return (page - 1) * take;
};
export class UserUpdateDTO extends UserCreateDTO {
  oldPassword: string;
}
export class UsersFilterDTO {
  name: string;
  page: number;
  take: number;
}
export class UsersDeleteDTO {
  id: string[];
}
