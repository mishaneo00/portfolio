const Router = require('express')
const router = new Router()
const typeController = require('../controllers/typeController')
const verifyMiddleware = require('../middleware/verifyMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')

//Маршрутизация по блоку типов девайсов

//В роуте используется middleware для проверки роли пользователя (если роль не ADMIN, ему будет отказано в доступе)
router.post('/', roleMiddleware, typeController.create)

router.get('/', typeController.getAll)

module.exports = router