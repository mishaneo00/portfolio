const Router = require('express')
const router = new Router()
const userRouter = require('./userRouter')
const typeRouter = require('./typeRouter')
const brandRouter = require('./brandRouter')
const deviceRouter = require('./deviceRouter')

//Маршрутизаци по приложению

router.use('/user', userRouter)
router.use('/type', typeRouter)
router.use('/device', deviceRouter)
router.use('/brand', brandRouter)

module.exports = router