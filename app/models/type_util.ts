import { SerializeFrom } from "@remix-run/node";

export type UnwrapPromise<U> = U extends Promise<infer T> ? T : never;

export type UnwrapArray<U> = U extends (infer T)[] ? T : U;

/**
 * 指定した関数の戻り値の型を、remixのjsonでシリアライズされた型に変換する
 * クライアント側でサーバー側から取得したデータを受け取るメソッドやpropsに利用可能
 *
 * Clientサイドのメソッド定義
 * ```typescript
 * function receiveUser(user: StripReturnType<typeof getUserById>) {
 *   ...
 * }
 * ```
 *
 */
export type StripReturnType<T extends (...args: any) => any> = SerializeFrom<
  UnwrapArray<UnwrapPromise<ReturnType<T>>>
>;
