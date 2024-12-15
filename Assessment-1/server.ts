import express, { Express } from "express";
import { connectDB } from "@configs";
import { json, urlencoded } from "body-parser";
import cors from "cors";
import { config } from "dotenv";
import { join } from "path";
import cookieParser from "cookie-parser";
import routes from '@routes';

// Initialize Express app
const app: Express = express();

// Load environment variables from.env file
config();

// Connect to MongoDB
connectDB();

// Middleware to parse JSON and URL-encoded data
app.use(json());
app.use(urlencoded({ extended: true }));

// Middleware to parse cookies
app.use(cookieParser());

// Enable CORS for cross-origin requests
app.use(cors());

// static folder
app.use('/uploads', express.static(join(__dirname, 'uploads')))

// routers
app.use(routes);

const port = process.env.PORT || 9000;
app.listen(port, () => {
    console.log(`Server running on  http://localhost:${port}  🔥`);
});