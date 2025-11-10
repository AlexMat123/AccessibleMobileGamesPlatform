import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./config/db.js";
import authRoutes from "./routes/auth.js";
import User from "./models/User.js";
import { createDatabaseIfNotExists } from "./config/createDatabase.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// ensuring database exists before sequelize connects
await createDatabaseIfNotExists();

// routes
app.use("/api/auth", authRoutes);

// Syncing and starting the server
sequelize
  .sync()
  .then(() => console.log("Database connected & synced"))
  .catch((err) => console.error("DB Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
