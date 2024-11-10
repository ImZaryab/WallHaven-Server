import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mediaRoutes from "./routes/media.js";
import downloadRoutes from "./routes/download.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/media", mediaRoutes);
app.use("/api/download", downloadRoutes);

app.get("/", (req, res) => res.send("Express on Vercel"));

app.listen(PORT, () =>
  console.log(`Server running on port: ${PORT}`)
);

export default app