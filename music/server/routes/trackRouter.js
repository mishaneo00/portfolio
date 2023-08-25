const Router = require('express')
const trackController = require('../controllers/trackController')
const verifyMiddleware = require('../middlewares/verify-middleware')
const router = new Router()

//Маршрутизация по блоку треков

router.post('/', verifyMiddleware, trackController.create)
router.delete('/:id', verifyMiddleware, trackController.delete)

router.get('/search', trackController.search)


router.get('/:id', trackController.getOne)
router.get('/', trackController.getAll)

router.post('/:id/comment', verifyMiddleware, trackController.addComment)
router.delete('/:id/comment', verifyMiddleware, trackController.deleteComment)

router.post('/:id/listen', trackController.listen)




module.exports = router