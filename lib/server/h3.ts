import type { Static, TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import {
  createError,
  eventHandler,
  getQuery,
  H3Event,
  readBody,
  send,
  setResponseHeader,
  setResponseStatus,
} from "h3";
import {
  OperationContract,
  OperationContractWithBody,
  OperationContractWithQuery,
  OperationContractWithQueryAndBody,
  hasBody,
  hasQuery,
} from "../operation.ts";

export function validateQuery<T extends TSchema>(event: H3Event, schema: T) {
  const query = getQuery(event);

  const casted = Value.Convert(schema, query);

  if (!Value.Check(schema, casted)) {
    throw createError({ statusCode: 400 });
  }

  return casted;
}

export function validateBody<T extends TSchema>(event: H3Event, schema: T) {
  const body = readBody(event);

  if (!Value.Check(schema, body)) {
    throw createError({ statusCode: 400 });
  }

  return body as Static<T>;
}

export function validateOperationQuery<T extends OperationContractWithQuery>(
  operation: T
) {
  return (event: H3Event) => {
    return validateQuery<T["query"]>(event, operation.query);
  };
}

export function validateOperationBody<T extends OperationContractWithBody>(
  operation: T
) {
  return (event: H3Event) => {
    return validateBody<T["body"]>(event, operation.body);
  };
}

type OperationResponse<T extends OperationContract> = {
  [K in keyof T["responses"]]: {
    status: K;
    data: Static<T["responses"][K]>;
  };
}[keyof T["responses"]];

export type OperationHandler<T extends OperationContract> =
  T extends OperationContractWithQueryAndBody
    ? (
        event: H3Event,
        options: { query: Static<T["query"]>; body: Static<T["body"]> }
      ) => Promise<OperationResponse<T>> | OperationResponse<T>
    : T extends OperationContractWithBody
    ? (
        event: H3Event,
        options: { body: Static<T["body"]> }
      ) => Promise<OperationResponse<T>> | OperationResponse<T>
    : T extends OperationContractWithQuery
    ? (
        event: H3Event,
        options: { query: Static<T["query"]> }
      ) => Promise<OperationResponse<T>> | OperationResponse<T>
    : (event: H3Event, options: {}) => Promise<OperationResponse<T>> | OperationResponse<T>;

export function operationHandler<T extends OperationContract>(
  operation: T,
  handler: OperationHandler<T>
) {
  const queryValidator =
    hasQuery(operation) && validateOperationQuery(operation);
  const bodyValidator = hasBody(operation) && validateOperationBody(operation);

  return eventHandler(async (event: H3Event) => {
    const query = queryValidator && queryValidator(event);
    const body = bodyValidator && bodyValidator(event);

    const result = await handler(event, { query, body } as any);

    setResponseStatus(event, result.status);
    setResponseHeader(event, "content-type", "application/json");
    return send(event, JSON.stringify(result.data));
  });
}
