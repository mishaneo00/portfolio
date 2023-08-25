const jwt = require('jsonwebtoken')
const tokenModel = require('../models/tokenModel')

//Класс сервис для выполнения задач с токенами доступа

class TokenService {

    //Метод генерации токенов. Получение данных из контроллера и генерация access и refresh токенов с помощью jsonwebtoken
    generateToken(payload) {
        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '30d' })
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' })
        return {
            accessToken,
            refreshToken
        }
    }

    //Метод проверки access токена, в котором мы получаем токен из контроллера, проверяем его и возвращаем данные пользователя
    validateAccessToken(token) {
        try {
            const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
            return userData
        }
        catch (e) {
            return null
        }
    }

    //Метод проверки refresh токена, в котором мы получаем токен из контроллера, проверяем его и возвращаем данные пользователя
    validateRefreshToken(token) {
        try {
            const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
            return userData
        }
        catch (e) {
            return null
        }
    }

    //Метод сохранения токена refresh в БД, в котором мы получаем токен и id пользователя, которому он принадлежит, из контроллера.
    //Если токен уже существует в базе данных, мы перезаписываем его и возвращаем.
    async saveToken(userId, refreshToken) {
        const tokenData = await tokenModel.findOne({ user: userId })
        if (tokenData) {
            tokenData.refreshToken = refreshToken
            return tokenData.save()
        }
        const token = await tokenModel.create({ user: userId, refreshToken })
        return token
    }

    //Метод удаления refresh токена из базы данных. Получаем токен и удаляем его
    async removeToken(refreshToken) {
        const tokenData = await tokenModel.deleteOne({ refreshToken })
        return tokenData
    }

    //Метод поиска refresh токена в БД
    async findToken(refreshToken) {
        const tokenData = await tokenModel.findOne({ refreshToken })
    }
}

module.exports = new TokenService()