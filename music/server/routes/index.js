const Router = require('express')
const router = new Router()
const userRouter = require('./userRouter')
const trackRouter = require('./trackRouter')

//Маршрутизация приложения

router.use('/users', userRouter)
router.use('/tracks', trackRouter)

module.exports = router