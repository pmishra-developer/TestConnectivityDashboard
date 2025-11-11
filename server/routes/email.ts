import express, { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

export const emailRouter = express.Router();

interface SmtpEmailRequest {
  provider: 'smtp';
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  from: string;
  to: string;
  subject: string;
  body: string;
}

interface SesEmailRequest {
  provider: 'ses';
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  from: string;
  to: string;
  subject: string;
  body: string;
}

emailRouter.post('/smtp', async (req: Request, res: Response) => {
  try {
    const emailData: SmtpEmailRequest = req.body;
    const { smtpHost, smtpPort, smtpUser, smtpPassword, from, to, subject, body } = emailData;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !from || !to || !subject) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword
      }
    });

    await transporter.sendMail({
      from,
      to,
      subject,
      text: body
    });

    res.json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('SMTP error:', error);
    res.status(500).json({
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

emailRouter.post('/ses', async (req: Request, res: Response) => {
  try {
    const emailData: SesEmailRequest = req.body;
    const { awsAccessKeyId, awsSecretAccessKey, awsRegion, from, to, subject, body } = emailData;

    if (!awsAccessKeyId || !awsSecretAccessKey || !awsRegion || !from || !to || !subject) {
      return res.status(400).json({ error: 'Missing required AWS SES fields' });
    }

    const sesClient = new SESClient({
      region: awsRegion,
      credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey
      }
    });

    const command = new SendEmailCommand({
      Source: from,
      Destination: {
        ToAddresses: [to]
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          Text: {
            Data: body,
            Charset: 'UTF-8'
          }
        }
      }
    });

    const result = await sesClient.send(command);

    res.json({
      message: 'Email sent successfully via Amazon SES!',
      messageId: result.MessageId
    });
  } catch (error) {
    console.error('SES error:', error);
    res.status(500).json({
      error: 'Failed to send email via Amazon SES',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
