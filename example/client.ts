import { Client } from "../client/ky.ts";
import ky from "ky";
import { ExampleOperations } from "./operations.ts";

const client = Client<ExampleOperations>(
  ky.create({
    prefixUrl: "http://localhost:4338",
  })
);

const response = await client["/getThings"].get({
  query: {
    flowers: true
  }
})

console.log(response.data.name)