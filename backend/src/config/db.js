import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    })
  : new Sequelize(
      process.env.DB_NAME || 'coarc_db',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      {
        host: process.env.DB_HOST || 'db', // 'db' matches docker-compose service name
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      }
    );

export const connectDB = async () => {
  let retries = 10; // Extra retries for slower local environments
  while (retries) {
    try {
      await sequelize.authenticate();
      console.log('✅ Conexión exitosa con PostgreSQL establecida por Sequelize.');
      return;
    } catch (err) {
      console.error(`❌ Error al conectar a PostgreSQL. Reintentando... (${retries} intentos restantes):`, err.message);
      retries -= 1;
      // Wait 3 seconds before next retry
      await new Promise(res => setTimeout(res, 3000));
    }
  }
  throw new Error('No se pudo establecer conexión con PostgreSQL.');
};

export default sequelize;
