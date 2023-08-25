const userModel = require("../models/userModel")
const userService = require("../services/userService")
const tokenService = require("../services/tokenService")
const ApiError = require("../exceptions/api-error")

//Класс контроллер для управления блоком пользователей

class UserController {

    //Метод регистрации пользователя, в котором мы получаем данные из тела и передаем их в сервис для создания пользователя
    async registration(req, res, next) {
        try {
            const { email, password, retryPass } = req.body
            if (!email || !password || !retryPass) {
                return next(ApiError.BadRequest('Заполните все поля'))
            }
            if (password !== retryPass) {
                return next(ApiError.BadRequest('Пароли не совпадают'))
            }
            const userData = await userService.registration(email, password)
            return res.json(userData)
        } catch (e) {
            next(e)
        }
    }

    //Метод входа на сайт, при котором мы получаем данные пользователя из body и передаем их сервису для обработки
    //В случае успешного входа мы записываем refresh токен в куки и возвращаем access токен на клиент
    async login(req, res, next) {
        try {
            const { email, password } = req.body
            if (!email || !password) {
                return next(ApiError.BadRequest('Заполните все поля'))
            }
            const userData = await userService.login(email, password)
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })

            return res.json(userData.accessToken)
        } catch (e) {
            next(e)
        }
    }

    //Метод Logout, в котором мы получаем refresh токен из куки и передаем его в сервис для обработки
    //После очищаем поле "refreshToken" в  cookie
    async logout(req, res, next) {
        try {
            const { refreshToken } = req.cookies
            const token = await userService.logout(refreshToken)
            res.clearCookie('refreshToken')
            return res.json(token)
        } catch (e) {
            next(e)
        }
    }

    //Метод активации аккаунта по почте, в котором мы получаем из параметров ссылку активации и передаем ее в сервис для обработки
    //После этого мы перенаправляем пользователя на клиент
    async activate(req, res, next) {
        try {
            const activationLink = req.params.link
            await userService.activate(activationLink)
            return res.redirect(process.env.CLIENT_URL)
        } catch (e) {
            next(e)
        }
    }

    //Метод обновления токена, в котором мы получаем refresh токен из coockie и передаем его в сервис для обработки
    //После этого мы перезаписываем refresh токен в coockie и передаем access токен на клиент
    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.cookies
            const userData = await userService.refresh(refreshToken)

            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })
            return res.json(userData.accessToken)
        } catch (e) {
            next(e)
        }
    }

    //Метод получения всех пользователей (написан только для проверки работоспособности некоторого промежуточного ПО)
    async getUsers(req, res, next) {
        try {
            const users = await userService.getAllUsers()
            return res.json(users)
        } catch (e) {
            next(e)
        }
    }
}

module.exports = new UserController()