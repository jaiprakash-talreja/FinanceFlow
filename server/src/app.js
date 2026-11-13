const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const env = require("./config/env");
const { notFound, errorHandler } = require("./middleware/error");

const app = express();

app.set("trust proxy", 1); // behind Render's proxy: needed for correct client IPs in rate limiting
app.use(helmet());
app.use(cors({ origin: env.clientUrls, credentials: true }));
app.use(express.json({ limit: "100kb" }));
if (!env.isTest) app.use(morgan(env.isProd ? "combined" : "dev"));

app.get("/api/health", (req, res) => res.json({ status: "ok", uptime: Math.round(process.uptime()) }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/budgets", require("./routes/budgetRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
