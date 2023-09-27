import { Type } from "@sinclair/typebox";
import { Operation } from "../operations.ts";

export const getThings = Operation({
  path: "/getThings",
  method: "get",
  query: Type.Object({
    flowers: Type.Boolean()
  }),
  responses: {
    200: Type.Object({
      name: Type.String(),
      flowers: Type.Boolean(),
    }),
  },
});

export type ExampleOperations = typeof getThings;