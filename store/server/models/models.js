const sequelize = require('../db')
const { DataTypes } = require('sequelize')
const { v4: uuidv4 } = require('uuid')

//Описание всех таблиц в БД, а так же связей между ними

const User = sequelize.define('user', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
    email: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: 'USER' },
    isActivated: { type: DataTypes.BOOLEAN, defaultValue: false },
    activationLink: { type: DataTypes.STRING }
})

const Basket = sequelize.define('basket', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
    totalCost: { type: DataTypes.INTEGER, defaultValue: 0 }
})

const BasketDevice = sequelize.define('basket_device', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() }
})

const Device = sequelize.define('device', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
    name: { type: DataTypes.STRING, unique: true, allowNull: false },
    price: { type: DataTypes.INTEGER, allowNull: false },
    rating: { type: DataTypes.DECIMAL(2, 1), defaultValue: 0 },
    count: { type: DataTypes.INTEGER, defaultValue: 0 },
    img: { type: DataTypes.STRING, allowNull: false }
})

const DeviceInfo = sequelize.define('device_info', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: false }
})

const Brand = sequelize.define('brand', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
    name: { type: DataTypes.STRING, unique: true, allowNull: false }
})

const Type = sequelize.define('type', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
    name: { type: DataTypes.STRING, unique: true, allowNull: false }
})

const Rating = sequelize.define('rating', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
    rating: { type: DataTypes.INTEGER, allowNull: false }
})

const TypeBrand = sequelize.define('type_brand', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() }
})

const Comment = sequelize.define('comment', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: () => uuidv4() },
    feedback: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, allowNull: false },
    rating: { type: DataTypes.INTEGER }
})

User.hasMany(Comment)
Comment.belongsTo(User)

Device.hasMany(Comment, { as: 'feedback' })
Comment.belongsTo(Device)

User.hasOne(Basket)
Basket.belongsTo(User)

User.hasMany(Rating)
Rating.belongsTo(User)

Basket.hasMany(BasketDevice)
BasketDevice.belongsTo(Basket)

Type.hasMany(Device)
Device.belongsTo(Type)

Brand.hasMany(Device)
Device.belongsTo(Brand)

Device.hasMany(Rating)
Rating.belongsTo(Device)

Device.hasMany(BasketDevice)
BasketDevice.belongsTo(Device)

Device.hasMany(DeviceInfo, { as: 'info' });
DeviceInfo.belongsTo(Device)

Type.belongsToMany(Brand, { through: TypeBrand })
Brand.belongsToMany(Type, { through: TypeBrand })

module.exports = {
    User, Basket, BasketDevice, Device, DeviceInfo, Brand, Type, Rating, TypeBrand, Comment
}

