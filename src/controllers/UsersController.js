const { hash, compare } = require("bcryptjs");
const AppError = require("../utils/AppError");
const knex = require('../database/knex');

class UsersController {
  async create(request, response) {
    const { name, email, password } = request.body;

    let user = { name, email, password };

    const [checkUserExists] =  await knex("users").where("email", email);

    if(checkUserExists) {
      throw new AppError("Este e-mail já está em uso.");
    }

    const hashedPassword = await hash(password, 8);
    user.password = hashedPassword;

    await knex("users").insert(user);

    return response.status(201).json();
  }

  async update(request, response) {
    const { name, email, password, old_password } = request.body;
    const { id } = request.params;

    const [user] =  await knex("users").where("id", id);

    if(!user) {
      throw new AppError("Usuário não encontrado!");
    }

    const [userWithUpdatedEmail] =  await knex("users").where("email", user.email);

    if(userWithUpdatedEmail && userWithUpdatedEmail.id !== user.id) {
      throw new AppError("O email informado já está cadastrado!");
    }

    user.name = name ?? user.name;
    user.email = email ?? user.email;

    if( password && !old_password ) {
      throw new AppError("Senha atual não informada!");
    }

    if( password && old_password ) {
      const checkOldPassword = await compare(old_password, user.password);

      if(!checkOldPassword) {
        throw new AppError("A senha atual está incorreta!");
      }

      user.password = await hash(password, 8);
    }

    await knex("users").where("id", id).update({
      name: user.name,
      email: user.email,
      password: user.password,
      updated_at: knex.fn.now()
    })

    return response.json();
  }
}

module.exports = UsersController;