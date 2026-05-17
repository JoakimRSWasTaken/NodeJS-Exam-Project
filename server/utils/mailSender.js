import nodemailer from 'nodemailer';

export async function sendWelcomeMail(recipientEmail) {
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({

        service: 'gmail',
        auth: {
            user: 'tthardlinemike@gmail.com',
            pass: process.env.GOOGLE_APP_PASSWORD,
        },
    });

    const info = await transporter.sendMail({
        from: '"The Administrator" <tthardlinemike@gmail.com>',
        to: recipientEmail,
        subject: 'Welcome to the flock!',
        text: 'We are very happy to see you the Serpent King as family! Together we will devour the very Gods!',
        html: '<h1>We are very happy to see you join the Serpent King as family!</h1></br><h3>Together we will devour the very Gods!</h3>',
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`Message sent to ${recipientEmail}!`);
    // console.log(`Message sent! Preview URL: ${previewUrl}`);    
}