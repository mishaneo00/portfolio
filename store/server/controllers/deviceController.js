const { Device, BasketDevice, Rating, Comment, Type, Brand, Basket } = require('../models/models')
const { DeviceInfo } = require('../models/models')
const ApiError = require('../errors/apiError')
const uuid = require('uuid')
const path = require('path')
const { Sequelize } = require('sequelize')
const { validationResult } = require('express-validator')

//Класс управления блоком девайсов

class DeviceController {

    //Метод для создания нового девайса
    //Получаем данные про девайс из body и files, проверяем поля на заполнение
    //Проверяем, существует ли такой девайс (если да - отправляем сообщение), а так же проверяем тип девайса и его бренд
    //Генерируем уникальное название для изображения
    //Создаем девайс
    //Если есть блок инфо, парсим его и через цикл записываем описание девайса в таблицу DeviceInfo
    //Возвращаем созданный девайс на клиент
    async createDevice(req, res, next) {
        try {
            const { name,
                price,
                brandName,
                typeName,
                info } = req.body
            if (!name || !price || !brandName || !typeName || !info) {
                return next(ApiError.badRequest('Заполните все поля'))
            }

            const candidate = await Device.findOne({ where: { name } })
            if (candidate) {
                return next(ApiError.badRequest('Такой девайс уже существует'))
            }
            const type = await Type.findOne({ where: { name: typeName } })
            if (!type) return next(ApiError.badRequest('Такого типа девайсов не существует'))
            const brand = await Brand.findOne({ where: { name: brandName } })
            if (!brand) return next(ApiError.badRequest('Такого бренда не существует'))


            const { img } = req.files || {}
            let fileName
            if (img) {
                fileName = uuid.v4() + ".jpg"
                img.mv(path.resolve(__dirname, '..', 'static', fileName))
            }


            const device = await Device.create({
                name,
                price,
                img,
                brandId: brand.id,
                typeId: type.id,
                img: fileName
            })

            if (info) {
                info = JSON.parse(info)
                info.forEach(i =>
                    DeviceInfo.create({
                        title: i.title,
                        description: i.description,
                        deviceId: device.id
                    })
                )
            }

            return res.json(device)

        } catch (e) {
            return next(ApiError.badRequest(e.message))
        }
    }

    //Метод для обновления девайсов
    //Получаем новые данные про девайс
    //Проверяем их на соответствие требованиям (наличие типа и бренда, не совпадение нового имени с каким-либо другим)
    //Обновляем те поля, которые были указаны в body
    //Возвращаем обновленный девайс на клиент
    async deviceUpdate(req, res, next) {
        try {
            const {
                name,
                price,
                brandName,
                typeName,
                info
            } = req.body
            const { id } = req.params
            const { img } = req.files || {}

            const device = await Device.findOne({
                where: { id }, include: [
                    { model: DeviceInfo, as: 'info' }
                ]
            })
            if (!device) return next(ApiError.badRequest('Девайс не найден'))

            if (name) {
                const candidateName = await Device.findOne({ where: { name } })
                if (candidateName) return next(ApiError.badRequest('Девайс с таким именем уже существует'))
                device.name = name
                await device.save()
            }

            if (price) {
                device.price = price
                await device.save()
            }

            if (brandName) {
                const brand = await Brand.findOne({ where: { name: brandName } })
                if (!brand) return next(ApiError.badRequest('Такого бренда не существует'))
                device.brandId = brand.id
                await device.save()
            }

            if (typeName) {
                const type = await Type.findOne({ where: { name: typeName } })
                if (!type) return next(ApiError.badRequest('Такого типа девайсов не существует'))
                device.typeId = type.id
                await device.save()
            }

            if (img) {
                const fileName = uuid.v4() + ".jpg"
                img.mv(path.resolve(__dirname, '..', 'static', fileName))
                device.img = fileName
                await device.save()
            }

            if (info) {
                const date = JSON.parse(info)
                date.forEach(async (i) => {
                    const { title, description } = i
                    await DeviceInfo.update({ title, description }, { where: { deviceId: device.id } })
                })
            }

            return res.json({ device })
        } catch (e) {
            return res.json('error')
        }
    }

    //Метод удаления девайса
    //Получаем id девайса из параметров и ищем его в таблице (если не нашли - кидаем ошибку)
    //Далее удаляем данные про девайс со всех таблиц, которые связанны с ним
    //Возвращаем на клиент уведомление об успешном удалении
    async deleteDevice(req, res, next) {
        try {
            const { id } = req.params
            const device = await Device.findByPk(id)
            if (!device) return next(ApiError.badRequest('Девайс не найден'))

            const deviceBasket = await BasketDevice.findAll({ where: { deviceId: device.id } })
            if (deviceBasket) {
                await BasketDevice.destroy({ where: { deviceId: device.id } })
            }

            const rating = await Rating.findAll({ where: { deviceId: device.id } })
            if (rating) {
                await Rating.destroy({ where: { deviceId: device.id } })
            }

            const feedback = await Comment.findAll({ where: { deviceId: device.id } })
            if (feedback) {
                await Comment.destroy({ where: { deviceId: device.id } })
            }

            const info = await DeviceInfo.findAll({ where: { deviceId: device.id } })
            if (info) {
                await DeviceInfo.destroy({ where: { deviceId: device.id } })
            }

            await Device.destroy({ where: { id: device.id } })
            return res.json('Девай удален')
        } catch (e) {
            return next(ApiError.badRequest(e))
        }
    }

    //Метод для просмотра всех девайсов, с возможностью сортировки по тренду и типу девайса, а так же постраничным отображением
    //Получаем название типа и бренда из query, а так же параметры постраничного отображения
    //Далее, в зависимости от указаных параметров, ищем девайсы в таблице и отправляем их на клиент
    async getAll(req, res, next) {
        try {
            let { brandName,
                typeName,
                page,
                limit } = req.query

            let brandId = null
            if (brandName) {
                const brand = await Brand.findOne({ where: { name: brandName } })
                if (!brand) return next(ApiError.badRequest('Такого бренда не найдено'))
                brandId = brand.id
            }

            let typeId = null
            if (typeName) {
                const type = await Type.findOne({ where: { name: typeName } })
                if (!type) return next(ApiError.badRequest('Девайсов такого типа не найдено'))
                typeId = type.id
            }

            page = page || 1
            limit = limit || 10
            let offset = page * limit - limit
            let devices
            if (!brandId && !typeId) {
                devices = await Device.findAndCountAll({
                    limit,
                    offset
                })
            }
            if (!brandId && typeId) {
                devices = await Device.findAndCountAll({
                    where: { typeId },
                    limit,
                    offset
                })
            }
            if (brandId && !typeId) {
                devices = await Device.findAndCountAll({
                    where: { brandId },
                    limit,
                    offset
                })
            }
            if (brandId && typeId) {
                devices = await Device.findAndCountAll({
                    where: { brandId, typeId },
                    limit,
                    offset
                })
            }
            return res.json(devices)
        } catch (e) {
            return next(ApiError.badRequest(e))
        }
    }

    //Метод для отображения конкретного девайса
    //Получаем id девайса из параметров
    //Ищем его в таблице (если не найден - выдаем сообщение об этом)
    //Возвращаем на клиент девайс с подробным отображением комментариев к нему и описания
    async getOne(req, res, next) {
        const { id } = req.params
        const device = await Device.findOne({
            where: { id },
            include: [
                { model: DeviceInfo, as: 'info' },
                { model: Comment, as: 'feedback' }
            ]
        })
        if (!device) return next(ApiError.badRequest('Девайс не найден'))
        return res.json(device)
    }

    //Метод добавления девайса в корзину
    //Получаем id девайса из параметров, а так же пользователя и req
    //Ищем нужный девайс в таблице (если не найден - выдаем ошибку)
    //Получаем id корзины из данных пользователя
    //Добавляем запись в промежуточную таблицу с указанием id девайса и корзины
    //Ищем корзину пользователя в таблице и обновляем данные про общую сумму добавленных в неё товаров
    //Сохраняем изменения в корзины и отправляем общуюю сумму на клиент
    async addDiviceToBasket(req, res, next) {
        try {
            const { id } = req.params
            const user = req.user
            const device = await Device.findOne({ where: { id } })
            if (!device) return next(ApiError.badRequest('Такого девайса не существует'))
            await BasketDevice.create({
                basketId: user.basketId,
                deviceId: id
            })
            const basket = await Basket.findOne({ where: { id: user.basketId } })
            const total = device.price + basket.totalCost
            basket.totalCost = total
            await basket.save()
            return res.json({ message: `Итого: ${basket.totalCost} гривен` })
        } catch (e) {
            return next(ApiError.badRequest(e))
        }
    }

    //Метод удаление девайса из корзины
    //Получаем id девайса из параметров
    //Ищем запись в промежуточной таблице по id девайса
    //Ищем девайс в таблице по id девайса
    //Удаляем запись в промежуточно таблице
    //Находим козрину пользователя
    //Обновляем данные про общую сумму, отнимая стоимость девайса
    //Сохраняем изменения и отправляем на клиент обновленную общую стомость
    async deleteDeviceInBasket(req, res, next) {
        try {
            const user = req.user
            const { id } = req.params
            const deviceBasket = await BasketDevice.findOne({ where: { deviceId: id } })
            if (!deviceBasket) {
                return next(ApiError.badRequest('Устройство в корзине не найдено'))
            }
            const device = await Device.findOne({ where: { id } })
            await BasketDevice.destroy({ where: { id: deviceBasket.id } })
            const basket = await Basket.findOne({ where: { id: user.basketId } })
            const total = basket.totalCost - device.price
            basket.totalCost = total
            await basket.save()
            return res.json({ message: `Девайс удален с корзины. Итого: ${basket.totalCost}` })
        } catch (e) {
            return next(ApiError.badRequest(e))
        }
    }

    //Метод добавление рейтинга к девайсу
    //Получаем id девайса из параметров
    //Находим девайс в таблице
    //Получаем данные пользователя из req
    //Проверяем наличие оценки этому девайсу от этого пользователя (чтобы пользователь мог поставить только одну оценку конкретному девайсу)
    //Получаем оценку из body и проверяем её на соответствие условиям
    //Создаем запись в таблице рейтинга
    //Подсчитываем кол-во оценок у данного девайса
    //Получаем сумму всех оценок и делим на кол-во оценок, чтобы получить среднюю оценку рейтинга
    //Обновляем у девайса поля с кол-вом оценом и средним рейтингом
    //Сохраняем девайс и отправляем его на клиент
    async addRating(req, res, next) {
        try {
            const { id } = req.params
            const device = await Device.findByPk(id)
            if (!device) return next(ApiError.badRequest('Такого девайса не существует'))

            const user = req.user
            const checkUser = await Rating.findOne({
                where: {
                    deviceId: id,
                    userId: user.id
                }
            })
            if (checkUser) return next(ApiError.badRequest('Оценка от этого пользователя уже есть'))

            const { rating } = req.body
            if (rating > 5 || rating < 1) return next(ApiError.badRequest('Значение не может быть меньше 1 и больше 5'))

            await Rating.create({
                deviceId: device.id,
                userId: user.id,
                rating
            })

            const count = (await Rating.findAll({
                where:
                    { deviceId: device.id }
            })).length
            const sum = await Rating.sum('rating', {
                where:
                    { deviceId: device.id }
            })
            const average = count > 0 ? (sum / count).toFixed(1) : 0;

            device.count = count
            device.rating = average
            await device.save()

            return res.json({ device })
        } catch (e) {
            return res.json(e)
        }
    }

    //Метод добавления комментариев
    //Получаем результаты валидации полей и прокидываем ошибки, если они есть
    //Получаем id девайса из параметров
    //Находим девайс в таблице
    //Получаем пользователя из req
    //Получаем комментарий из body
    //Ищем запись про рейтинг от этого пользователя данному девайсу, чтобы прикрепить оценку к комментарию (если записей нет, ставим 0)
    //Добавляем комментарий в таблицу
    //Передаем уведомление про успешное добавление комментария на клиент
    async addComment(req, res, next) {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                const errorsMessage = errors.array().map(error => error.msg)
                return next(ApiError.badRequest('Ошибка валидации', errorsMessage))
            }
            const { id } = req.params
            const device = await Device.findByPk(id)
            if (!device) return next(ApiError.badRequest('Такого девайса не существует'))

            const user = req.user
            const { feedback } = req.body

            const record = await Rating.findOne({
                where: {
                    deviceId: id,
                    userId: user.id
                }
            })

            let rating = 0

            if (record) {
                rating = record.rating
            }

            await Comment.create({
                userId: user.id,
                deviceId: id,
                rating: rating,
                feedback,
                username: user.username
            })

            return res.send('Отзыв добавлен')

        } catch (e) {
            return res.json(e)
        }
    }
}

module.exports = new DeviceController()