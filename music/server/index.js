require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const router = require('./routes/index')
const mongoose = require('mongoose')
const errorMiddleware = require('./middlewares/error-middleware')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')

const app = express()       //Создаем экземпляр приложения
const PORT = process.env.PORT || 3003

app.use(cors({
    credentials: true, // Этот параметр указывает, что при выполнении запросов с другого домена будут отправляться куки, аутентификационные заголовки и другие учетные данные
    origin: process.env.CLIENT_URL // указывает каким доменам разрешено отправлять запросы к моему серверу
}))
app.use(express.json())     //Встроенный middleware express, который разбирает входящий JSON объект и делает его доступным в req.body
app.use(cookieParser()) // Middleware, который используется для разбора и обработки куки, которые отправленны клиентом

app.use(express.static(path.resolve(__dirname, 'static')))      // Настраивает приложение на обслуживание статический файлов
app.use(fileUpload({}))     // Настраивает приложение на обработку загрузки файлов
app.use('/api', router)     //Маршрутизация приложения
app.use(errorMiddleware)    //Обработчик ошибок

const start = async () => {
    try {
        await mongoose.connect(process.env.DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        app.listen(PORT, () => console.log(`Server started on ${PORT} port`))
    } catch (e) {
        console.log(e);
    }
}
start()