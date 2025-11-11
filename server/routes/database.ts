import express, { Request, Response } from 'express';
import { Client } from 'pg';

export const databaseRouter = express.Router();

interface DbRequest {
  connectionString: string;
  username: string;
  password: string;
}

databaseRouter.post('/test', async (req: Request, res: Response) => {
  let client: Client | null = null;

  try {
    const dbData: DbRequest = req.body;
    const { connectionString, username, password } = dbData;

    if (!connectionString || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const url = new URL(connectionString);
    url.username = username;
    url.password = password;

    client = new Client({
      connectionString: url.toString()
    });

    await client.connect();

    const result = await client.query('SELECT version()');
    const version = result.rows[0]?.version || 'Unknown version';

    await client.end();

    res.json({
      success: true,
      message: 'Connection successful!',
      details: `Connected successfully. Database version: ${version}`
    });
  } catch (error) {
    if (client) {
      try {
        await client.end();
      } catch (e) {
        console.error('Error closing connection:', e);
      }
    }

    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unable to connect to database'
    });
  }
});
