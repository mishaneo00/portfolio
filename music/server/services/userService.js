const userModel = require('../models/userModel')
const bcrypt = require('bcrypt')
const uuid = require('uuid')
const ApiError = require('../exceptions/api-error')
const UserDto = require('../dto/userDto')
const tokenService = require('./tokenService')
const mailService = require("../services/mailService")

//Сервис для выполнения задач в блоке пользователей

class UserService {

    //Метод создания пользователя, в котором мы получаем email и пароль от контроллера
    //Проверяем, существует ли пользователь с таким email
    //Хешируем пароль с помощью bcrypt
    //Генерируем ссылку активации
    //Создаем пользователя в коллекции
    //Отправляем письмо с активацией
    //Возвращаем пользователя
    async registration(email, password) {
        const candidate = await userModel.findOne({ email })
        if (candidate) {
            throw ApiError.BadRequest('Пользователь с таким email уже существует')
        }
        const hashPassword = await bcrypt.hash(password, 4)
        const activationLink = uuid.v4()
        const user = await userModel.create({ email, password: hashPassword, activationLink })
        await mailService.sendActivationMail(email, `${process.env.API_URL}/api/users/activate/${activationLink}`)
        return user
    }

    //Метод входа на сайт, в котором мы получаем e-mail и пароль от контроллера
    //Поиск пользователя (если он не найден, то выдается ошибка)
    //Сравниваем пароли с помощью bcrypt
    //Создаем dto на основе полученного пользователя
    //Вызываем метод для генерации токена
    //Возвращаем токены и пользователя
    async login(email, password) {
        const user = await userModel.findOne({ email })
        if (!user) throw ApiError.BadRequest('Пользователя с таким email не существует')
        const isPassEquals = await bcrypt.compare(password, user.password)
        if (!isPassEquals) throw ApiError.BadRequest('Неверный пароль')
        const userDto = new UserDto(user)
        const token = tokenService.generateToken({ ...userDto })
        await tokenService.saveToken(userDto.id, token.refreshToken)
        return { ...token, user: userDto }
    }

    //Метод logout, в котором мы получаем refresh токен от контроллера
    //Удаляем его из коллекции
    async logout(refreshToken) {
        const token = await tokenService.removeToken(refreshToken)
        return token
    }

    //Метод активации учетной записи по почте, в котором мы получаем ссылку активации от контроллера
    //Ищем пользователя, которому принадлежит ссылка.
    //Изменяем его поле isActivated на true
    async activate(activationLink) {
        const user = await userModel.findOne({ activationLink })
        if (!user) {
            throw ApiError.BadRequest('Неккоректная ссылка активации')
        }
        user.isActivated = true
        await user.save()
    }

    //Метод обновления токена, в котором мы получаем refresh токен от контроллера
    //Валидируем этот токен с помощью сервиса токенов
    //Находим этот токен в коллекции
    //Получаем пользователя и создаем dto
    //Генерируем токены и возвращаем их
    async refresh(refreshToken) {
        if (!refreshToken) {
            throw ApiError.UnauthorizedError('Пользователь не авторизован')
        }
        const userData = tokenService.validateRefreshToken(refreshToken)
        const tokenFromDb = await tokenService.findToken(refreshToken)
        if (!userData || !tokenFromDb) {
            throw ApiError.UnauthorizedError('Пользователь не авторизован')
        }
        const user = await userModel.findById(userData.id)
        const userDto = new UserDto(user)
        const token = tokenService.generateToken({ ...userDto })
        await tokenService.saveToken(userDto.id, token.refreshToken)
        return { ...token, user: userDto }
    }

    //Метод отображения всех пользователей
    async getAllUsers() {
        const users = await userModel.find()
        return users
    }
}

module.exports = new UserService()