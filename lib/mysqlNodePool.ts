import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getMysqlNodePool(): mysql.Pool | null {
  if (pool) return pool;

  const host = process.env.MYSQL_HOST || 'localhost';
  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;

  if (!database || !user) {
    return null;
  }

  try {
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4'
    });
    return pool;
  } catch (e) {
    console.warn("Could not initialize MySQL pool:", e);
    return null;
  }
}
