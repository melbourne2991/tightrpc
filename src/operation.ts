import { TObject, TSchema, Static } from "@sinclair/typebox";

export const Operation: OperationsMake = (contract) => {
  return contract;
};

export function matchStatus<K extends number, T extends { status: K | number }>(
  it: T,
  status: K
): it is Extract<T, { status: K }> {
  return it.status === status;
}

export type ClientOperations<
  T extends OperationContract = OperationContract,
  AO = never,
  AM = false
> = MapOperations<T, AO, AM>;

type MapOperations<T extends OperationContract, AO = never, AM = false> = {
  [K in T["path"]]: MapMethod<Extract<T, { path: K }>, AO, AM>;
};

interface Responses {
  [status: number]: TSchema;
}

interface OperationContractBase<
  M extends string = string,
  R extends Responses = Responses,
  P extends string = string
> {
  method: M;
  responses: R;
  path: P;
}

export interface OperationContractWithQuery<
  M extends string = string,
  R extends Responses = Responses,
  P extends string = string,
  Q extends TObject = TObject
> extends OperationContractBase<M, R, P> {
  query: Q;
}

export interface OperationContractWithBody<
  M extends string = string,
  R extends Responses = Responses,
  P extends string = string,
  B extends TObject = TObject
> extends OperationContractBase<M, R, P> {
  body: B;
}

export interface OperationContractWithQueryAndBody<
  M extends string = string,
  R extends Responses = Responses,
  P extends string = string,
  Q extends TObject = TObject,
  B extends TObject = TObject
> extends OperationContractBase<M, R, P> {
  query: Q;
  body: B;
}

type OperationContractWithQueryOrBody<
  M extends string = string,
  R extends Responses = Responses,
  P extends string = string,
  Q extends TObject = TObject,
  B extends TObject = TObject
> =
  | OperationContractWithQuery<M, R, P, Q>
  | OperationContractWithBody<M, R, P, B>;

export type OperationContract<
  M extends string = string,
  R extends Responses = Responses,
  P extends string = string,
  Q extends TObject = TObject,
  B extends TObject = TObject
> =
  | OperationContractBase<M, R, P>
  | OperationContractWithQuery<M, R, P, Q>
  | OperationContractWithBody<M, R, P, B>
  | OperationContractWithQueryAndBody<M, R, P, Q, B>;

type CommonMethod = "get" | "post" | "put" | "delete" | "patch";

// Probably not needed, but just in case - scratch that - leaving them out for now
// | "head"
// | "options"
// | "trace"
// | "connect";

interface OperationsMake {
  <
    M extends CommonMethod = CommonMethod,
    R extends Responses = Responses,
    P extends string = string,
    Q extends TObject = TObject,
    B extends TObject = TObject,
    T extends OperationContract<M, R, P, Q, B> = OperationContract<
      M,
      R,
      P,
      Q,
      B
    >
  >(
    contract: T
  ): T;
}

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type KnownResponses<T extends OperationContract> = {
  [K in keyof T["responses"]]: {
    raw: Response;
    status: K;
    data: Static<T["responses"][K]>;
  };
}[keyof T["responses"]];



type MapResponse<T extends OperationContract, AM> = Promise<
  // If AM is set, then we assume the status always matches
  // one of those in the contract. Useful if the adapter just wants
  // to throw an error on non-200 responses. Not completely type safe
  // but it's opt-in.
  AM extends true
    ? KnownResponses<T>
    : Prettify<
        | KnownResponses<T>
        | {
            raw: Response;
            status: number;
            data: unknown;
          }
      >
>;

type ExtractRouteParams<T> = Prettify<
  T extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? { [K in Param]: string } & ExtractRouteParams<Rest>
    : T extends `${infer _Before}:${infer Param}`
    ? { [K in Param]: string }
    : {}
>;

type IsNotEmpty<T, A, B> = T extends {} ? (keyof T extends never ? B : A) : A;
type HasPath<T extends OperationContract, A, B> = IsNotEmpty<
  ExtractRouteParams<T["path"]>,
  A,
  B
>;

type MapQueryBodyInput<T extends OperationContract> =
  T extends OperationContractWithQueryAndBody
    ? { query: Static<T["query"]>; body: Static<T["body"]> }
    : T extends OperationContractWithQuery
    ? { query: Static<T["query"]> }
    : T extends OperationContractWithBody
    ? { body: Static<T["body"]> }
    : {};

type AdapterConfig<T> = {
  config?: T;
};

type MapOperationFunction<
  T extends OperationContractBase,
  AO,
  AM
> = T extends OperationContractWithQueryOrBody
  ? (
      input: Prettify<
        MapQueryBodyInput<T> &
          HasPath<T, { params: ExtractRouteParams<T["path"]> }, {}> &
          AdapterConfig<AO>
      >
    ) => MapResponse<T, AM>
  : HasPath<
      T,
      (
        input: Prettify<
          { params: ExtractRouteParams<T["path"]> } & AdapterConfig<AO>
        >
      ) => MapResponse<T, AM>,
      (options?: AdapterConfig<AO>) => MapResponse<T, AM>
    >;

export type AlwaysMatchStatus = true;

type MapMethod<T extends OperationContract, AO, AM> = {
  [K in T["method"]]: MapOperationFunction<Extract<T, { method: K }>, AO, AM>;
};

export type OperationPathParams<T extends OperationContract> = ExtractRouteParams<T["path"]>

// Guards to check if the operation has a query or body
export function hasQuery<T extends OperationContract>(
  operation: T
): operation is T & OperationContractWithQuery {
  return "query" in operation;
}

export function hasBody<T extends OperationContract>(
  operation: T
): operation is T & OperationContractWithBody {
  return "body" in operation;
}