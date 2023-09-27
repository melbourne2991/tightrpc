import { Client } from "../src/client/ky.ts";
import ky from "ky";
import { ExampleOperations } from "./operations.ts";

// Ky doesn't like leading slashes when prefixUrl is set
const stripLeadingSlash = true;

const client = Client<ExampleOperations>(
  ky.create({
    prefixUrl: "http://localhost:4338",
  }),
  stripLeadingSlash
);

const response = await client["/getThings"].get({
  query: {
    flowers: true
  }
})

console.log(response.data.name)