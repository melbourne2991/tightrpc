export const Operation = (contract) => {
  return contract;
};
export function matchStatus(it, status) {
  return it.status === status;
}
export function hasQuery(operation) {
  return "query" in operation;
}
export function hasBody(operation) {
  return "body" in operation;
}
