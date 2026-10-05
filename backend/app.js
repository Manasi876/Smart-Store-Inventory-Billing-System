import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    }),
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes
import userRouter from "./routes/user.routes.js";
import categoryRouter from "./routes/category.routes.js";
import productRouter from "./routes/product.routes.js";
import salesRouter from "./routes/sales.routes.js";
import paymentRouter from "./routes/payment.routes.js";

import aiRouter from "./routes/ai.routes.js";

// import healthcheckRouter from "./routes/healthcheck.routes.js"

//routes declaration
// app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/sales", salesRouter);
app.use("/api/v1/payments", paymentRouter);

app.use("/api/v1/ai", aiRouter);

app.use(errorHandler);
export { app };
