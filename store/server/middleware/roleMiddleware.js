const jwt = require('jsonwebtoken')
const ApiError = require('../errors/apiError')

//Middleware для проверки роли пользователя
//Получаем токен из хедеров
//Декодируем токен с верификацией
//Проверяем роль внутри токена на соответствие указаной роли для доступа
//Выдаем соответствующие сообщения

module.exports = function (req, res, next) {
    if (req.method === 'OPTIONS') next()
    try {
        const token = req.headers.authorization.split(' ')[1]
        if (!token) {
            return next(ApiError.badRequest('Пользователь не авторизован'))
        }
        const user = jwt.verify(token, process.env.SECRET_KEY)
        if (user.role === 'ADMIN') {
            next()
        }
        if (user.role !== 'ADMIN') {
            return next(ApiError.badRequest('Доступ только для ADMIN'))
        }
    } catch (e) {
        console.log(e)
        return res.status(403).json({ message: 'Пользователь не авторизован' })
    }
}