import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { REGISTRY_PORT } from "../config";

export type Node = { nodeId: number; pubKey: string };

export type RegisterNodeBody = {
  nodeId: number;
  pubKey: string;
};

export type GetNodeRegistryBody = {
  nodes: Node[];
};

export type NodeWPrivateKey = Node & {privateKey:string};


export async function launchRegistry() {
  const _registry = express();
  _registry.use(express.json());
  _registry.use(bodyParser.json());

  const registeredNodes: Node[] = [];
  let nodeRegistry: Node[] = [];

  _registry.get("/status", (req, res) => {
    res.send("live");
  });

  _registry.get("/getNodeRegistry", (req, res) => {
    const registry = { nodes: nodeRegistry };
    return res.json(registry);
  });

  _registry.post("/registerNode", (req, res) => {
    const { nodeId, pubKey } = req.body;

    if (!nodeId || typeof nodeId !== "number" || !pubKey || typeof pubKey !== "string") {
      return res.status(400).json({ error: "Invalid request body" });
    }

    if (registeredNodes.some((node) => node.nodeId === nodeId)) {
      return res.status(409).json({ error: "Node already registered" });
    }

    const newNode: Node = { nodeId, pubKey };
    registeredNodes.push(newNode);

    return res.status(201).json({ message: "Node registered successfully", node: newNode });
  });


  _registry.get("/getPrivateKey", (req, res) => {
    res.json("live");
  });


  const server = _registry.listen(REGISTRY_PORT, () => {
    console.log(`registry is listening on port ${REGISTRY_PORT}`);
  });

  return server;
}
