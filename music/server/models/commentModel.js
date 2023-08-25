const { Schema, model } = require('mongoose')

//Описание модели коллекции в базе данных

const CommentSchema = new Schema({
    userEmail: { type: String },
    text: { type: String, required: true }
})

module.exports = model('Comment', CommentSchema)