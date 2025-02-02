import { Client } from 'pg';
import { config } from 'dotenv';
import { getOldTables } from './old-tables';

const initDB = async () => {
    config();
    
    const { DB_HOST, DB_PORT, DB_USER, DB_PASS, OLD_DB_NAME } = process.env;
    const DB = new Client({
        user: DB_USER,
        database: OLD_DB_NAME,
        password: DB_PASS,
        port: Number(DB_PORT),
        host: DB_HOST,
        keepAlive: true,
    });
    
    await DB.connect();
    return DB;
};


const main = async () => {
    const old = getOldTables(await initDB());
};

