import { Client as CoreClient } from "./core.js";
export const Client = (kyInstance, stripLeadingSlash = false) => {
  return CoreClient((call) => {
    const method = call.method;
    let mappedEndpoint = replacePathParams(call.endpoint, call.args?.params || {});
    if (stripLeadingSlash && mappedEndpoint.startsWith("/")) {
      mappedEndpoint = mappedEndpoint.slice(1);
    }
    const res = kyInstance(mappedEndpoint, {
      searchParams: call.args?.query,
      json: call.args?.body,
      method,
      ...call.adapterOptions
    });
    return res.json().then(async (data) => {
      const raw = await res;
      return {
        raw,
        status: raw.status,
        data
      };
    });
  });
};
function replacePathParams(path, params) {
  for (const key in params) {
    const value = params[key];
    path = path.replace(`:${key}`, value);
  }
  return path;
}
