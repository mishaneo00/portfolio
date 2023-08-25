const { Schema, model } = require('mongoose')

//Описание модели коллекции в базе данных

const TrackSchema = new Schema({
    name: { type: String, unique: true, required: true },
    listens: { type: Number, default: 0 },
    artist: { type: String },
    picture: { type: String },
    audio: { type: String },
    whоAdded: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }]
})

module.exports = model('Track', TrackSchema)