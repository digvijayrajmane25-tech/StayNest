class ExpressError extends Error {
    constructor(status = 500, message = "Something went wrong") {
        super(message);
        this.statusCode = status;
        this.message = message;
    }
}
module.exports = ExpressError;