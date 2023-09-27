export function Client(adapter) {
  const methodProxyCache = /* @__PURE__ */ new Map();
  const getMethodProxy = (endpoint) => {
    let methodProxy = methodProxyCache.get(endpoint);
    if (!methodProxy) {
      methodProxy = new Proxy(
        {},
        {
          get: (target, prop, receiver) => {
            const method = prop.toString();
            return (args) => {
              const call = {
                method,
                endpoint,
                args
              };
              return adapter(call);
            };
          }
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
      }
    }
  );
  return endpointProxy;
}
