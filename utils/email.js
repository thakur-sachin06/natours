const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Sachin Thakur <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // SEDNDGRID to send real emails in next lectures
      return 1;
    }
    // in development we'll use nodemailer to trap mails
    // creating a transporter we use nodemailer.
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // render HTML based on a pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        // sending name and url to pug template so that we can use there
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );
    // defining email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    };

    //create a transport and sending email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to Natours Family!'); // 'welcome' is the pug template
  }

  async sendPasswordReset() {
    await this.send(
      'passwordResetEmail',
      'Password reset Link. Valid for only 10 minutes!'
    ); // 'welcome' is the pug template
  }
};
