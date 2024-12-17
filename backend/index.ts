import express from "express";
import connectDb from "./db/mongoDbConnect";
import userRouter from "./router/user";

const app = express();

app.use(express.json());

app.use("/api/user-service", userRouter);

const startServer = async () => {
  try {
    await connectDb("mongodb://localhost:27017/apexx");

    app.listen(4000, () => {
      console.log("the server is running");
    });
  } catch (error) {
    console.error(error);
  }
};

startServer();
