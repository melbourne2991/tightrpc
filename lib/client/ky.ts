import type ky from "ky";
import type { Options as KyOptions, SearchParamsOption }  from 'ky'
import { Client as CoreClient } from "./core.ts";
import { OperationContract } from "../operation.ts";

export const Client = <T extends OperationContract>(kyInstance: typeof ky, stripLeadingSlash: boolean = false) => {
  return CoreClient<T, KyOptions, true>((call) => {
    const method = call.method;
    let mappedEndpoint = replacePathParams(call.endpoint, call.args?.params || {})

    if (stripLeadingSlash && mappedEndpoint.startsWith('/')) {
      mappedEndpoint = mappedEndpoint.slice(1)
    }

    const res = kyInstance(mappedEndpoint, {
      searchParams: call.args?.query as SearchParamsOption,
      json: call.args?.body,
      method,
      ...(call.adapterOptions as any),
    })

    return res.json().then(async (data) => {
      const raw = await res;

      return {
        raw,
        status: raw.status,
        data,
      }
    })
  });
};

function replacePathParams(path: string, params: { [key: string]: string }): string {
  for (const key in params) {
      const value = params[key];
      path = path.replace(`:${key}`, value);
  }
  return path;
}