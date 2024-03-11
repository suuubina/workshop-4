import bodyParser from "body-parser";
import express from "express";
import { BASE_USER_PORT, BASE_ONION_ROUTER_PORT } from "../config";
import {createRandomSymmetricKey, symEncrypt, rsaEncrypt, exportSymKey} from "@/src/crypto";
import {GetNodeRegistryBody, Node} from "@/src/registry/registry";


export type SendMessageBody = {
  message: string;
  destinationUserId: number;
};

export interface Registry{
  nodes : Node[];
}

let lastReceivedMessage: string| null = null;
let lastSentMessage: string| null = null;
let lastCircuit: Node[]=[];

export async function user(userId: number) {
  const _user = express();
  _user.use(express.json());
  _user.use(bodyParser.json());


  _user.get("/status", (req, res) => {
    res.send("live");
  });

  _user.get("/getLastReceivedMessage",(req,res)=>{
    res.json({result: lastReceivedMessage});
  });

  _user.get("/getLastSentMessage",(req,res)=>{
    res.json({result: lastSentMessage});
  });

  _user.get("/getLastCircuit",(req,res)=>{
    res.json({result: lastCircuit.map((node)=> node.nodeId)});
  });

  _user.post("/message", (req, res) => {
    const message = req.body.message;

    lastReceivedMessage = message;

    res.status(200).send("success");
  });


  const server = _user.listen(BASE_USER_PORT + userId, () => {
    console.log(
      `User ${userId} is listening on port ${BASE_USER_PORT + userId}`
    );
  });

  return server;
}
