const Router = require('express')
const userController = require('../controllers/userController')
const router = new Router()

//Маршрутизация по блоку пользователей

router.post('/registration', userController.registration)
router.get("/activate/:link", userController.activate);
router.post('/login', userController.login)
router.post('/logout', userController.logout)
router.post('/refresh', userController.refresh)
router.get('/getUsers', userController.getUsers)

module.exports = router