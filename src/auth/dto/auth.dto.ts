export class UserCreateDTO {
  userName: string;

  password: string;
  name: string;

  email: string;
}

export class UserUpdateDTO extends UserCreateDTO {}
