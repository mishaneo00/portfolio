const Router = require('express')
const router = new Router()
const deviceController = require('../controllers/deviceController')
const verifyMiddleware = require('../middleware/verifyMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')
const { body } = require('express-validator')

//Маршрутизация по блоку девайсов

//В роуте используется middleware для проверки роли пользователя (если роль не ADMIN, ему будет отказано в доступе)
router.post('/', roleMiddleware, deviceController.createDevice)
router.put('/:id/deviceUpdate', roleMiddleware, deviceController.deviceUpdate)
router.delete('/:id', roleMiddleware, deviceController.deleteDevice)

router.get('/', deviceController.getAll)
router.get('/:id', deviceController.getOne)

//В роуте используется middleware для проверки авторизации пользователя
router.post('/:id', verifyMiddleware, deviceController.addDiviceToBasket)
router.delete('/basket/:id', verifyMiddleware, deviceController.deleteDeviceInBasket)

//В роуте используется middleware для проверки авторизации пользователя
router.post('/:id/deviceRating', verifyMiddleware, deviceController.addRating)
router.post('/:id/deviceFeedback',
    body('feedback', 'Поле не может быть пустым').isLength({ min: 1 }),
    verifyMiddleware, deviceController.addComment)

module.exports = router