const ApiError = require("../exceptions/api-error")
const commentModel = require("../models/commentModel")
const trackModel = require("../models/trackModel")
const uuid = require('uuid')
const path = require('path')
const fs = require('fs')

//Сервис для выполнения задач в блоке треков

class TrackService {

    //Метод создания звуковой дорожки, при котором мы получаем данные звуковой дорожки из контроллера
    //Проверяем, существует ли она уже в базе данных
    //Создаем уникальные имена с помощью метода createFile и записываем звуковую дорожку в базу данных
    //Добавляем id пользователя, который добавляет звуковую дорожку
    //Возвращаем созданную звуковую дорожку
    async create(name, artist, audiofile, img, id) {
        const candidate = await trackModel.findOne({ name })
        if (candidate) {
            throw ApiError.BadRequest('Такой трек уже существует')
        }

        const audio = await this.createFile(audiofile, 'audio')
        const picture = await this.createFile(img, 'picture')
        const track = await trackModel.create({ name, artist, listens: 0, audio, picture })
        track.whоAdded.push(id)
        await track.save()
        return track
    }

    //Метод удаления аудиодорожки, в котором мы получаем id аудиодорожки и пользователя
    //Проверяем, существует ли данная аудиодорожка
    //Проверяем, совпадает ли id добавившего ее человека с id того, кто пытается ее удалить.
    //Если совпадает, то удалить статические файлы и запись из базы данных методом removeFile.
    //Возвращаем удаленную звуковую дорожку
    //В случае ошибки вывести ее клиенту
    async delete(id, userId) {
        const track = await trackModel.findById(id)
        if (!track) {
            throw ApiError.BadRequest('Трек не найден')
        }
        const whoAdded = track.whоAdded.toString()
        if (userId === whoAdded) {
            await this.removeFile(track.picture)
            await this.removeFile(track.audio)
            const trackData = await trackModel.deleteOne({ _id: id })
            return { trackData }
        }
        throw ApiError.BadRequest('Удалять можно только свои треки')
    }

    //Метод просмотра конкретной аудиодорожки, в котором мы получаем id аудиодорожки из контроллера
    //Находим ее в базе данных и выводим комментарии к ней в поле "comments".
    //Если аудиодорожка не найдена, выводим ошибку
    async getOne(id) {
        const track = await trackModel.findById(id).populate('comments')
        if (!track) {
            throw ApiError.BadRequest('Трек не найден')
        }
        return track
    }

    //Метод отображения всех звуковых дорожек, в котором мы получаем из контроллера параметры для постраничного отображения файлов и возвращаем треки
    async getAll(offset, count) {
        offset = offset || 0
        count = count || 10
        const tracks = await trackModel.find().skip(offset).limit(count)
        return tracks
    }

    //Метод добавления комментариев, в котором мы получаем из контроллера id звуковой дорожки, email пользователя и комментарий
    //Создаем запись в коллекции комментариев
    //Добавляем id комментария к звуковой дорожке
    async addComment(id, email, text) {
        const track = await trackModel.findById(id)
        const comment = await commentModel.create({ userEmail: email, text })
        track.comments.push(comment._id)
        await track.save()
        return comment
    }

    //Метод удаления комментария, в котором мы получаем id звуковой дорожки и комментария из контроллера
    //Находим аудиодорожку в коллекции
    //Удаляем комментарий из коллекции, записывая его в commentData
    //Находим нужный по id в списке комментариев аудиодорожки
    //Используем метод "splice" для удаления нужного комментария из массива комментариев
    async deleteComment(id, commentId) {
        const track = await trackModel.findById(id)
        const commentData = await commentModel.deleteOne(commentId)
        const index = track.comments.findIndex(comment => comment._id === commentData._id)
        track.comments.splice(index, 1)
        await track.save()
        return track
    }

    //Метод создания статического файла, в котором мы получаем файл и его тип из метода создания звуковой дорожки
    //Получаем расширение файла
    //Создаем уникальное имя файла, добавив к нему расширение
    //Формируем путь к файлу
    //Проверяем наличие такого пути, если его нет, то рекурсивно создаем все папки.
    //Добавляем в нее файл
    //Возвращаем тип файла, который вместе с именем файла является и папкой хранения.
    async createFile(file, fileType) {
        const fileExtension = file.name.split('.').pop()
        const fileName = uuid.v4() + '.' + fileExtension
        const filePath = path.resolve(__dirname, '..', 'static', fileType)
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath, { recursive: true })
        }
        fs.writeFileSync(path.resolve(filePath, fileName), file.data)
        return fileType + '/' + fileName
    }

    //Метод удаления статических файлов, в котором мы получаем имя файла из метода удаления звуковой дорожки
    //Генерируем ошибку, если файл не найден
    //Удаляем файл по маршруту
    async removeFile(fileName) {
        const filePath = path.resolve(__dirname, '..', 'static', fileName)
        if (!fs.existsSync(filePath)) {
            return 'Файлы не найдены'
        }
        fs.unlinkSync(filePath)
    }

    //Метод добавления прослушивания аудиодорожки, в котором мы получаем id аудиодорожки из контроллера
    //Находим его в коллекции
    //Обновляем количество слушателей и сохраняем его
    async listen(id) {
        const track = await trackModel.findById(id)
        track.listens += 1
        track.save()
    }

    //Метод поиска звуковой дорожки по фрагменту названия
    //Находим аудиодорожку в коллекции с помощью нечувствительного к регистру регулярного выражения
    async search(param) {
        const tracks = await trackModel.find({
            name: { $regex: new RegExp(param, 'i') }
        })
        return tracks
    }
}

module.exports = new TrackService()