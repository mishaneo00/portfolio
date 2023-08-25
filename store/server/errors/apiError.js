
//Класс, который расширяет класс Error
//Содержит в себе три статических метода, которые доступны при обращении напрямую к классу, а не к его новым экземплярам

class ApiError extends Error {
    status
    errors
    constructor(status, message, errors = []) {
        super(message)
        this.status = status
        this.message = message
        this.errors = errors
    }

    static badRequest(message, errors) {
        return new ApiError(404, message, errors)
    }

    static internal(message) {
        return new ApiError(500, message)
    }

    static forbidden(message) {
        return new ApiError(403, message)
    }
}

module.exports = ApiError