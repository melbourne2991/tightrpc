import { ClientOperations, OperationContract } from "../operation.ts";

export type ClientCallArgs =
  | undefined
  | {
      query?: Record<string, unknown>;
      body?: unknown;
      params?: Record<string, string>;
      config?: unknown
    };

export interface ClientCall {
  method: string;
  endpoint: string;
  args: ClientCallArgs;
  adapterOptions?: unknown;
}

export interface ClientResponse {
  raw: Response;
  status: number;
  data: unknown;
}

export interface ClientAdapter {
  (call: ClientCall): Promise<ClientResponse>;
}

export function Client<T extends OperationContract, AdapterOptions = never, AM = false>(
  adapter: ClientAdapter
): ClientOperations<T, AdapterOptions, AM> {
  const methodProxyCache = new Map<string, any>();

  const getMethodProxy = (endpoint: string) => {
    let methodProxy = methodProxyCache.get(endpoint);

    if (!methodProxy) {
      methodProxy = new Proxy(
        {},
        {
          get: (target, prop, receiver) => {
            const method = prop.toString();

            return (args: ClientCallArgs) => {
              const call: ClientCall = {
                method,
                endpoint,
                args,
              };

              return adapter(call);
            };
          },
        }
      );

      methodProxyCache.set(endpoint, methodProxy);
    }

    return methodProxy;
  };

  const endpointProxy = new Proxy(
    {},
    {
      get: (target, prop, receiver) => {
        const endpoint = prop.toString();
        const methodProxy = getMethodProxy(endpoint);
        return methodProxy;
      },
    }
  );

  return endpointProxy as ClientOperations<T, AdapterOptions, AM>;
}
