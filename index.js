import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mediaRoutes from "./routes/media.js";
import downloadRoutes from "./routes/download.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/media", mediaRoutes);
app.use("/api/download", downloadRoutes);

app.get("/", (req, res) => {
  console.log("[GET ROUTE]");
  res.send("HELLO FROM HOMEPAGE");
});

app.listen(PORT, () =>
  console.log(`Server running on port: ${PORT}`)
);
