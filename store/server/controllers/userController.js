const ApiError = require("../errors/apiError")
const { User, Basket, BasketDevice, Device } = require("../models/models")
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { validationResult } = require("express-validator")
const uuid = require('uuid')
const mailService = require("../service/mail-service")


//Класс управления пользователями

class UserController {

    //Метод для регистрации пользователей
    //Получаем результат валидации полей (если есть ошибки - отправляем их на клиент)
    //Получаем email, password, retryPass and username из body, сравниваем пароли
    //Проверяем, существует ли пользователь с таким username (если да - отправляем ошибку); хэшируем пароль с помощью bcrypt
    //Создаем уникальную ссылку активации
    //Создаем пользователя в базе данных и создаем корзину, которая пренадлежит этому пользователю
    //Отправляем письмо на почту с ссылкой для активации аккаунта
    //Возвращаем на клиент уведомление об успешной регистрации
    async registration(req, res, next) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            const errorsMessage = errors.array().map(error => error.msg)
            return next(ApiError.badRequest('Ошибка валидации', errorsMessage))
        }
        const { email,
            password,
            retryPass,
            username } = req.body
        if (password !== retryPass) {
            return next(ApiError.badRequest('Пароли не совпадают'))
        }
        const candidate = await User.findOne({ where: { username } })
        if (candidate) {
            return next(ApiError.badRequest('Пользователь с таким именем уже зарегестрирован'))
        }
        const hashPassword = bcrypt.hashSync(password, 4)
        const activationLink = uuid.v4()

        const user = await User.create({
            email,
            password: hashPassword,
            username,
            activationLink
        })
        await Basket.create({ userId: user.id })
        await mailService.sendActivationMail(email, `${process.env.API_URL}/api/user/activate/${activationLink}`)
        return res.json({ message: 'Пользователь зарегистрирован' })
    }

    //Метод для активации аккаунта по почте
    //Получаем ссылку активации из параметров и ищем по ней пользователя в базе данных
    //Меняем поле isActivated на true и перенаправляем пользователя на клиент
    async activate(req, res, next) {
        try {
            const activationLink = req.params.link
            const user = await User.findOne({ where: { activationLink: activationLink } })
            if (!user) {
                throw ApiError.BadRequest('Некорректная ссылка активации')
            }
            user.isActivated = true
            await user.save()
            return res.redirect(process.env.CLIENT_URL)
        } catch (e) {
            return next(ApiError.badRequest(e))
        }
    }

    //Метод для входа на сайт
    //Получаем username and password из body и проверяем их
    //Далее ищем корзину в базе данных, пренадлежащюю пользователю
    //Создаем объект "payload" со всеми необходимыми данными и с помощью "jsonwebtoken" генерируем токен доступа
    async login(req, res, next) {
        const { username, password } = req.body
        const user = await User.findOne({ where: { username } })
        if (!user) {
            return next(ApiError.badRequest('Неверный email или пароль'))
        }
        const passEquals = bcrypt.compareSync(password, user.password)
        if (!passEquals) {
            return next(ApiError.badRequest('Неверный email или пароль'))
        }
        const basket = await Basket.findOne({ where: { userId: user.id } })
        const payload = {
            id: user.id,
            email: user.email,
            username,
            role: user.role,
            basketId: basket.id
        }
        const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '24h' })
        return res.json({ token })
    }

    //Метод для удаления пользователей
    //Получаем id пользователя из параметров и находим его в базе данных (отправляем ошибку если он не найден)
    //Удаляем его с базы данных
    //Возвращаем на клиент уведомление об удалении
    async deleteUser(req, res, next) {
        try {
            const { id } = req.params
            const user = await User.findByPk(id)
            if (!user) {
                return next(ApiError.badRequest('Пользователь не найден'))
            }
            await User.destroy({ where: { id } })
            return res.json({ message: 'Пользователь удален' })
        } catch (e) {
            return res.json({ message: 'Ошибка' })
        }
    }

    //Метод для проверки приложения
    async check(req, res, next) {
        return res.send('OK')
    }
}

module.exports = new UserController()