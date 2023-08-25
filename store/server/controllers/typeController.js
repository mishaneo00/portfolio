const { Type } = require('../models/models')
const ApiError = require('../errors/apiError')

class TypeController {

    //Метод создания типа девайсов
    //Получаем данные из body и проверяем на наличие уже такого типа девайсов
    //Делаем запись в таблице и возвращаем на клиент созданный тип
    async create(req, res) {
        const { name } = req.body
        const candidate = await Type.findOne({ where: { name } })
        if (candidate) {
            return next(ApiError.badRequest('Такой тип устройств уже существует'))
        }
        const type = await Type.create({ name })
        return res.json(type)
    }

    //Метод получения всех типов девайсов
    async getAll(req, res) {
        const type = await Type.findAll()
        return res.json(type)
    }
}

module.exports = new TypeController()