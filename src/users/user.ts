import bodyParser from "body-parser";
import express from "express";
import { BASE_USER_PORT } from "../config";

export type SendMessageBody = {
  message: string;
  destinationUserId: number;
};

export async function user(userId: number) {
  const _user = express();
  _user.use(express.json());
  _user.use(bodyParser.json());

  _user.get("/status", (req, res) => {
    res.send("live");
  });

  // /getLastReceivedMessage
  _user.get("/getLastReceivedMessage", (req, res) => {
    res.json({ result: null });
  });
  
  // /getLastSentMessage
  _user.get("/getLastSentMessage", (req, res) => {
    res.json({ result: null });
  });
  _user.post("/message", (req, res) => {
    const { message }: SendMessageBody = req.body;
    console.log(`User ${userId} received message: ${message}`);
    res.json({ message: "Message received successfully" });
  });

  const server = _user.listen(BASE_USER_PORT + userId, () => {
    console.log(
      `User ${userId} is listening on port ${BASE_USER_PORT + userId}`
    );
  });

  return server;
}
