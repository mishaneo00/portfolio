const ApiError = require("../errors/apiError")
const jwt = require('jsonwebtoken')

//Middleware для проверки авторизации и аутентификации токена пользователя
//Получаем токен и декодируем его с проверкой подлинности

module.exports = function (req, res, next) {
    if (req.method === 'OPTIONS') next()
    try {
        const authorizationHeader = req.headers.authorization
        if (!authorizationHeader) {
            return next(ApiError.UnauthorizedError)
        }
        const token = authorizationHeader.split(' ')[1]
        if (!token) {
            return next(ApiError.badRequest('Пользователь не авторизован'))
        }
        const decodedData = jwt.verify(token, process.env.SECRET_KEY)
        req.user = decodedData
        next()
    } catch (e) {
        console.log(e);
        return next(e)
    }
}