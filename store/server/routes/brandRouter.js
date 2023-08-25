const Router = require('express')
const router = new Router()
const brandController = require('../controllers/brandController')
const verifyMiddleware = require('../middleware/verifyMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')

//Маршрутизация по блоку брендов

//В роуте используется middleware для проверки роли пользователя (если роль не ADMIN, ему будет отказано в доступе)
router.post('/', roleMiddleware, brandController.create)
router.get('/', brandController.getAll)

module.exports = router