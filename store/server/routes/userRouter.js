const Router = require('express')
const router = new Router()
const userController = require('../controllers/userController')
const verifyMiddleware = require('../middleware/verifyMiddleware')
const { body, check } = require('express-validator')
const roleMeddleware = require('../middleware/roleMiddleware')

//Маршрутизация по блоку пользователей

//В данном роуте используется middleware для верификации входящих данных (проверяем поля на соответствие условиям)
router.post('/registration', body('email', 'Неккоректный email').isEmail(),
    body('password', 'Пароль должен содержать не менее 4 символов').isLength({ min: 4 }),
    body('username', 'Слишком короткое имя пользователя (минимум 5 символов)').isLength({ min: 4 }),
    userController.registration)

router.post('/login', userController.login)

router.get("/activate/:link", userController.activate)

//Следующие два роута содержат middleware для проверки роли пользователя (если пользователь не ADMIN, ему будет отказано в доступе)
router.delete('/:id/delete', roleMeddleware, userController.deleteUser)
router.get('/auth', roleMeddleware, userController.check)

module.exports = router