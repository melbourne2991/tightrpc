import { Client, ClientCall, ClientResponse } from "./client/core.ts";
import { ClientOperations, Operation, matchStatus } from "./mod.ts";
import {
  assertSpyCall,
  spy,
} from "https://deno.land/std@0.202.0/testing/mock.ts";
import { Type } from "@sinclair/typebox";
import { assertEquals } from "https://deno.land/std@0.202.0/assert/assert_equals.ts";
import { AlwaysMatchStatus } from "./operations.ts";

const getThings = Operation({
  path: "getThings",
  method: "get",
  responses: {
    200: Type.Object({
      name: Type.String(),
    }),
  },
});

const getOtherThings = Operation({
  path: "/getOtherThings/:a/or/:b/dope",
  method: "get",
  query: Type.Object({
    ditto: Type.String(),
  }),
  responses: {
    200: Type.Object({
      name: Type.String(),
    }),
    201: Type.Object({
      other: Type.String(),
    }),
  },
});

type ExampleOperations = typeof getOtherThings | typeof getThings;

Deno.test("types", () => {
  async function _typeTest(api: ClientOperations<ExampleOperations>) {
    const a = api["/getOtherThings/:a/or/:b/dope"].get({
      params: {
        a: "",
        b: "",
      },
      query: {
        ditto: "",
      },
    });

    // @ts-expect-error (missing params)
    const a2 = api["/getmega/:a/or/:b/dope"].get({
      query: {
        ditto: "",
      },
    });

    // @ts-expect-error (missing query)
    const a3 = api["/getmega/:a/or/:b/dope"].get({
      params: {
        a: "",
        b: "",
      },
    });

    // Can call other operations
    const c = await api.getThings.get();

    // Requires guard to access data in a type-safe way
    if (matchStatus(c, 200)) {
      c.data.name;
    }

    // @ts-expect-error (unknown data)
    c.data.name;
  }

  // With AlwaysMatchStatus c.data.name is always available
  // because we're assuming only specified status codes are returned
  // and in this case we're only specifying 200.
  async function _typeTest2(api: ClientOperations<ExampleOperations, never, AlwaysMatchStatus>) {
    // Can call other operations
    const c = await api.getThings.get();
    
    c.data.name;
  }
});

Deno.test("client - makes expected calls", async () => {
  const mockedReturnValue = {
    raw: new Response(JSON.stringify({ name: "hello" }), {
      status: 200,
    }),
    status: 200,
    data: { name: "hello" },
  };

  const adapterSpy = spy<unknown, [ClientCall], Promise<ClientResponse>>(
    (call) => {
      return Promise.resolve(mockedReturnValue);
    }
  );

  const client = Client<ExampleOperations>(adapterSpy);

  const result = await client.getThings.get();

  assertEquals(result, mockedReturnValue);

  assertSpyCall(adapterSpy, 0, {
    args: [
      {
        method: "get",
        endpoint: "getThings",
        args: undefined,
      },
    ],
  });
});

Deno.test("client - makes expected calls (advanced)", async () => {
  const mockedReturnValue = {
    raw: new Response(JSON.stringify({ name: "hello" }), {
      status: 200,
    }),
    status: 200,
    data: { name: "hello" },
  };

  const adapterSpy = spy<unknown, [ClientCall], Promise<ClientResponse>>(
    (call) => {
      return Promise.resolve(mockedReturnValue);
    }
  );

  const client = Client<ExampleOperations>(adapterSpy);

  const result = await client["/getOtherThings/:a/or/:b/dope"].get({
    query: {
      ditto: "hello",
    },
    params: {
      a: "a",
      b: "b",
    },
  });

  assertSpyCall(adapterSpy, 0, {
    args: [
      {
        method: "get",
        endpoint: "/getOtherThings/:a/or/:b/dope",
        args: {
          query: {
            ditto: "hello",
          },
          params: {
            a: "a",
            b: "b",
          },
        },
      },
    ],
  
  });
});

Deno.test("client - accepts adapter options", async () => {
  const mockedReturnValue = {
    raw: new Response(JSON.stringify({ name: "hello" }), {
      status: 200,
    }),
    status: 200,
    data: { name: "hello" },
  };

  const adapterSpy = spy<unknown, [ClientCall], Promise<ClientResponse>>(
    (call) => {
      return Promise.resolve(mockedReturnValue);
    }
  );

  const client = Client<ExampleOperations, { magical: boolean }>(adapterSpy);

  const result = await client.getThings.get({
    config: {
      magical: true,
    },
  });

  assertSpyCall(adapterSpy, 0, {
    args: [
      {
        method: "get",
        endpoint: "getThings",
        args: {
          config: {
            magical: true,
          },
        },
      },
    ],
  });
});
