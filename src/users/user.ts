import express from "express";
import { BASE_USER_PORT, BASE_ONION_ROUTER_PORT, REGISTRY_PORT } from "../config";
import axios from 'axios';
import {createRandomSymmetricKey, rsaEncrypt, symEncrypt, exportSymKey, importSymKey} from "../crypto";
import { Node } from "../registry/registry";

export async function user(userId: number) {
  const _user = express();
  _user.use(express.json());

  let lastReceivedDecryptedMessage: string | null = null;
  let lastSentDecryptedMessage: string | null = null;
  let lastCircuit: Node[] = [];

  _user.get("/status", (_req, res) => res.status(200).send('live'));

  _user.get("/getLastReceivedMessage", (_req, res) => res.json({ result: lastReceivedDecryptedMessage }));

  _user.get("/getLastSentMessage", (_req, res) => res.json({ result: lastSentDecryptedMessage }));

  _user.get("/getLastCircuit", (_req, res) => {
    if (lastCircuit.length > 0) {
      res.json({ result: lastCircuit.map(node => node.nodeId) });
    } else {
      res.status(404).send("No circuit has been created yet!");
    }
  });

  _user.post("/message", (req, res) => {
    lastReceivedDecryptedMessage = req.body.message;
    res.status(200).send("Message received successfully.");
  });

  _user.post("/sendMessage", async (req, res) => {
    const { message, destinationUserId } = req.body;
    const nodes = (await axios.get(`http://localhost:${REGISTRY_PORT}/getNodeRegistry`)).data.nodes;
    let circuit: Node[] = [];

    while (circuit.length < 3) {
      let node = nodes[Math.floor(Math.random() * nodes.length)];
      if (!circuit.find(n => n.nodeId === node.nodeId)) {
        circuit.push(node);
      }
    }

    lastSentDecryptedMessage = message;
    let encryptedMessage = message;
    let destination = `${BASE_USER_PORT + destinationUserId}`.padStart(10, '0');

    for (const node of circuit) {
      const symKey = await createRandomSymmetricKey();
      const symKeyString = await exportSymKey(symKey);
      encryptedMessage = await rsaEncrypt(symKeyString, node.pubKey) + await symEncrypt(symKey, destination + encryptedMessage);
      destination = `${BASE_ONION_ROUTER_PORT + node.nodeId}`.padStart(10, '0');
    }

    lastCircuit = circuit.reverse();

    await axios.post(`http://localhost:${BASE_ONION_ROUTER_PORT + lastCircuit[0].nodeId}/message`, { message: encryptedMessage });
    res.status(200).send("Message sent successfully through the circuit.");
  });

  const server = _user.listen(BASE_USER_PORT + userId, () => {
    console.log(`User ${userId} is listening on port ${BASE_USER_PORT + userId}`);
  });

  return server;
}
