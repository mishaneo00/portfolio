const ApiError = require('../errors/apiError')

//Middleware для обработки ошибок

module.exports = function (err, req, res, next) {
    if (err instanceof ApiError) {
        return res.status(err.status).json({ message: err.message, err })
    }
    return res.status(500).json({ message: 'Непредвиденная ошибка!' })
}