import sql from "mssql/msnodesqlv8.js";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,

  driver: "ODBC Driver 18 for SQL Server",

  options: {
    trustedConnection: true,
    trustServerCertificate: true,
    encrypt: false,
  },
};

let pool = null;

export async function connectDB() {
  try {
    console.log("Connecting to SQL Server...");
    console.log("Server:", process.env.DB_SERVER);
    console.log("Database:", process.env.DB_DATABASE);
    console.log("Driver: ODBC Driver 18 for SQL Server");
    console.log("Authentication: Windows Authentication");

    pool = await sql.connect(dbConfig);

    console.log("SQL Server connected successfully");

    return pool;
  } catch (error) {
    console.error("SQL Server connection failed:");
    console.error(error);

    throw error;
  }
}

export function getPool() {
  if (!pool) {
    throw new Error("Database is not connected");
  }

  return pool;
}

export { sql };