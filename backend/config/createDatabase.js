import mariadb from "mariadb";
import dotenv from "dotenv";
dotenv.config();

export async function createDatabaseIfNotExists() {
  const connection = await mariadb.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
  });

  const dbName = process.env.DB_NAME;
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  console.log(` Database '${dbName}' checked or created`);
  await connection.end();
}
