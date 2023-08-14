import { SerializeFrom } from "@remix-run/node";

export type UnwrapPromise<U> = U extends Promise<infer T> ? T : never;

export type UnwrapArray<U> = U extends (infer T)[] ? T : U;

export type StripReturnType<T extends (...args: any) => any> = SerializeFrom<
  UnwrapArray<UnwrapPromise<ReturnType<T>>>
>;
