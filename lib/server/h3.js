import { Value } from "@sinclair/typebox/value";
import {
  createError,
  eventHandler,
  getQuery,
  readBody,
  send,
  setResponseHeader,
  setResponseStatus
} from "h3";
import {
  hasBody,
  hasQuery
} from "../operation.js";
export function validateQuery(event, schema) {
  const query = getQuery(event);
  const casted = Value.Convert(schema, query);
  if (!Value.Check(schema, casted)) {
    throw createError({ statusCode: 400 });
  }
  return casted;
}
export function validateBody(event, schema) {
  const body = readBody(event);
  if (!Value.Check(schema, body)) {
    throw createError({ statusCode: 400 });
  }
  return body;
}
export function validateOperationQuery(operation) {
  return (event) => {
    return validateQuery(event, operation.query);
  };
}
export function validateOperationBody(operation) {
  return (event) => {
    return validateBody(event, operation.body);
  };
}
export function operationHandler(operation, handler) {
  const queryValidator = hasQuery(operation) && validateOperationQuery(operation);
  const bodyValidator = hasBody(operation) && validateOperationBody(operation);
  return eventHandler(async (event) => {
    const query = queryValidator && queryValidator(event);
    const body = bodyValidator && bodyValidator(event);
    const result = await handler(event, { query, body });
    setResponseStatus(event, result.status);
    setResponseHeader(event, "content-type", "application/json");
    return send(event, JSON.stringify(result.data));
  });
}
