import express from "express";
import connectDb from "./db/mongoDbConnect";

const app = express();

const startServer = async () => {
  try {
    await connectDb("mongodb://localhost:2707/apexx");

    app.listen(4000, () => {
      console.log("the server is running");
    });
  } catch (error) {
    console.error(error);
  }
};

startServer();
