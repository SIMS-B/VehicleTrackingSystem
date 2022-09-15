const nodemailer = require('nodemailer');

// importing app configurations
const appConfig = require('config');

const transporter = nodemailer.createTransport(appConfig.get('nodeMailer'));

module.exports = transporter;