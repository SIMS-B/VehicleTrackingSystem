const nodemailer = require('nodemailer');

// importing app configurations
const config = require('config');

const transporter = nodemailer.createTransport(config.get('nodeMailer'));

module.exports = transporter;