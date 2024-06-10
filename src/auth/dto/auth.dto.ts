export class UserCreateDTO {
  userName: string;

  password: string;

  name: string;

  email: string;
  roleId: number;
}

export class UserUpdateDTO extends UserCreateDTO {
  oldPassword: string;
}
export class UsersDeleteDTO {
  id: string[];
}
