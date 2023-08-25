const ApiError = require("../exceptions/api-error")
const trackService = require("../services/trackService")

//Класс контроллер для управления блоком треков

class TrackController {

    //Метод создания аудиодорожки, в котором мы получаем название дорожки, 
    //имя исполнителя и файлы с изображением и самой аудиодорожкой и передаем их в сервис для создания.
    //После создания мы возвращаем аудиодорожку на клиент
    async create(req, res, next) {
        try {
            const { name, artist } = req.body
            const { id } = req.user

            if (!name || !artist) {
                return next(ApiError.BadRequest('Заполните все поля'))
            }
            const { audiofile, img } = req.files || {}
            if (!audiofile) {
                return next(ApiError.BadRequest('Выберите аудиофайл'))
            }
            if (!img) {
                return next(ApiError.BadRequest('Выберите обложку'))
            }

            const track = await trackService.create(name, artist, audiofile, img, id)
            return res.json(track)
        } catch (e) {
            next(e)
        }
    }

    //Метод удаления трека, в котором мы получаем id трека и пользователя (необходимо, чтобы пользователь удалял только свои треки)
    //После этого мы передаем данные в сервис и возвращаем удаленный трек на клиент
    async delete(req, res, next) {
        try {
            const { id } = req.params
            const user = req.user
            const userId = user.id
            const track = await trackService.delete(id, userId)
            return res.json(track)
        } catch (e) {
            next(e)
        }
    }

    //Метод просмотра конкретной звуковой дорожки
    //Поиск в базе данных по идентификатору трека и возврат его на клиент
    async getOne(req, res, next) {
        try {
            const { id } = req.params
            const track = await trackService.getOne(id)
            return res.json(track)
        } catch (e) {
            next(e)
        }
    }

    //Метод просмотра всех треков
    //Получение из запроса параметров для постраничного отображения треков
    //Возвращаем треки на клиент
    async getAll(req, res, next) {
        try {
            let { offset, count } = req.query
            const tracks = await trackService.getAll(offset, count)
            return res.json(tracks)
        } catch (e) {
            next(e)
        }
    }

    //Метод записи комментариев к треку, при котором мы получаем email пользователя, 
    //комментарий и id трека, к которому будет относиться комментарий, и передаем эти данные в сервис.
    //После этого мы возвращаем комментарий на клиент
    async addComment(req, res, next) {
        try {
            const { id } = req.params
            const { email } = req.user
            const { text } = req.body
            const comment = await trackService.addComment(id, email, text)
            return res.json({ comment })
        } catch (e) {
            next(e)
        }
    }

    //Метод удаления комментария, в котором мы получаем трек и id комментария и передаем данные сервису для удаления
    //Вернуть клиенту сообщение об успешном удалении
    async deleteComment(req, res, next) {
        try {
            const { id } = req.params
            const commentId = req.body
            const data = await trackService.deleteComment(id, commentId)
            return res.json({ data, message: 'Комментарий удален' })
        } catch (e) {
            next(e)
        }
    }

    //Метод обновления количества прослушиваний трека, в котором мы получаем id трека и передаем его в сервис
    async listen(req, res, next) {
        try {
            const { id } = req.params
            await trackService.listen(id)
            return res.json('OK')
        } catch (e) {
            next(e)
        }
    }

    //Метод поиска трека по имени, в котором мы получаем параметры поискового запроса и передаем их сервису
    //После этого мы возвращаем найденный трек на клиент
    async search(req, res, next) {
        try {
            const { query } = req.query
            const tracks = await trackService.search(query)
            return res.json(tracks)
        } catch (e) {
            next(e)
        }
    }
}

module.exports = new TrackController()