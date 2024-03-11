import bodyParser from "body-parser";
import express from "express";
import { BASE_USER_PORT, NODE_REGISTRY } from "../config";
import { symEncrypt, createRandomSymmetricKey, exportSymKey, exportPubKey } from "./crypto";

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
    const publicKey = NODE_REGISTRY[destinationUserId].publicKey;
    const circuit = Array.from({ length: 3 }, () => {
      return NODE_REGISTRY[Math.floor(Math.random() * NODE_REGISTRY.length)];
    });
    let encryptedMessage = await symEncrypt(await createRandomSymmetricKey(), message);
    let destination = destinationUserId.toString().padStart(10, "0");
    for (const node of circuit) {
      const symmetricKey = await createRandomSymmetricKey();
      const encryptedSymmetricKey = await symEncrypt(publicKey, symmetricKey);
      const previousValue = destination + encryptedMessage;
      encryptedMessage = await symEncrypt(symmetricKey, previousValue + encryptedSymmetricKey);
      destination = node.id.toString().padStart(10, "0");
    }
    const entryNode = circuit[0];
    const entryNodeUrl = `http://localhost:${entryNode.port}/message`;
    fetch(entryNodeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: encryptedMessage }),
    })
      .then(() => {
        res.json({ message: "Message sent successfully" });
      })
      .catch((error) => {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Internal server error" });
      });
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

