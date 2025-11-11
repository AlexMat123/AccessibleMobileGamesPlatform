import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Sequelize } from 'sequelize';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

function assertEnv(name) {
    if (!process.env[name]) {
        console.error(`ENV ${name} is missing`);
    }
}
['DB_HOST','DB_USER','DB_PASS','DB_NAME'].forEach(assertEnv);

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        dialect: 'mariadb',
        logging: false
    }
);

export async function connectDB() {
    try {
        console.log(`Connecting as user=${process.env.DB_USER} host=${process.env.DB_HOST}`);
        await sequelize.authenticate();
        console.log('MariaDB connected');
    } catch (err) {
        console.error('DB connection error:', err);
        process.exit(1);
    }
}

export { sequelize };
export default sequelize;