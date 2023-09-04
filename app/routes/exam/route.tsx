import {
  ActionArgs,
  json,
  LoaderArgs,
  type V2_MetaFunction,
} from "@remix-run/node";
import * as yaml from "yaml";
import {
  Form,
  useActionData,
  useLoaderData,
} from "@remix-run/react";
import invariant from "tiny-invariant";
import { getLatestTerms, getTermById } from "~/models/term.server";
import { toInputDateTimeLocal } from "~/time_util";
import { upsertAskSelectionSet } from "~/models/term_update.server";
import Editor from "@monaco-editor/react";
import { useState } from "react";

export const meta: V2_MetaFunction = () => [{ title: "Remix Notes" }];


export default function Exam() {
  return <div>試験</div>
}
