import bodyParser from "body-parser";
import express from "express";
import { BASE_USER_PORT } from "../config";
import { symEncrypt, createRandomSymmetricKey } from "./crypto";

export type SendMessageBody = {
  message: string;
  destinationUserId: number;
};

async function user(userId: number) {
  const _user = express();
  _user.use(express.json());
  _user.use(bodyParser.json());

  _user.get("/status", (req, res) => {
    res.send("live");
  });

  _user.post("/sendMessage", async (req, res) => {
    const { message, destinationUserId }: SendMessageBody = req.body;
    const destinationPort = Math.floor(Math.random() * 1000) + 4000; 
    const encryptedMessage = await symEncrypt(await createRandomSymmetricKey(), message);
    console.log(`Sending encrypted message to port ${destinationPort}: ${encryptedMessage}`);
    res.json({ message: "Message sent successfully" });
  });

  _user.post("/message", async (req, res) => {
    const { message }: { message: string } = req.body;
    console.log(`User ${userId} received message: ${message}`);
    res.json({ message: "Message received successfully" });
  });

  const server = _user.listen(BASE_USER_PORT + userId, () => {
    console.log(`User ${userId} is listening on port ${BASE_USER_PORT + userId}`);
  });

  return server;
}

export { user };
