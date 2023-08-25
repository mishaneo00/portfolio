const { Brand } = require('../models/models')
const ApiError = require('../errors/apiError')

class BrandController {

    //Метод создание бренда
    //Получаем данные из body и проверяем на наличие уже такого бренда
    //Создаем запись в таблице брендов
    //Возвращаем бренд на клиент
    async create(req, res) {
        const { name } = req.body
        const candidate = await Brand.findOne({ where: { name } })
        if (candidate) {
            return next(ApiError.badRequest('Такой брэнд уже существует'))
        }
        const brand = await Brand.create({ name })
        return res.json(brand)
    }

    //Метод получения всех брендов из таблицы
    async getAll(req, res) {
        const brands = await Brand.findAll()
        return res.json(brands)
    }
}

module.exports = new BrandController()