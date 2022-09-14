// imports logger
const { createLogger, transports, format } = require("winston");

const customFormat = format.combine(format.timestamp(), format.printf((log) => {
    return `Timestamp: ${log.timestamp} - [${log.level.toUpperCase()}] - ${log.message}`
}))

const logger = createLogger({
    format: customFormat,
    transports: [
        // new transports.Console(),
        new transports.File({filename: 'app.log', maxSize: 10000})
    ]
});

module.exports = logger;