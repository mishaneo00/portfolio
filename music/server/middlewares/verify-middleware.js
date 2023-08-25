const jwt = require('jsonwebtoken')
const ApiError = require('../exceptions/api-error')

//Middleware для проверки авторизации пользователя и подлинности его токена доступа

//Получение токена из заголовков (если он там есть) и декодирование его с учетом аутентификации

module.exports = function (req, res, next) {
    if (req.method === 'OPTIONS') next()
    try {
        const authorizationHeader = req.headers.authorization
        if (!authorizationHeader) {
            return next(ApiError.UnauthorizedError())
        }
        const token = authorizationHeader.split(' ')[1]

        if (!token) {
            return next(ApiError.UnauthorizedError())
        }
        const decodedData = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
        req.user = decodedData
        next()
    } catch (e) {
        console.log(e);
        return next(e)
    }
}