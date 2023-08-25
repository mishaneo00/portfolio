
//Класс UserDto для генерации токена доступа

module.exports = class UserDto {
    email;
    id;
    isActivated;

    constructor(model) {
        this.email = model.email
        this.id = model._id
        this.isActivated = model.isActivated
    }
}