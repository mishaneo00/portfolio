const { Schema, model } = require('mongoose')

//Описание модели коллекции в базе данных

const TokenSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    refreshToken: { type: String, required: true }
})

module.exports = model('Token', TokenSchema)