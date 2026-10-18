"use server";

import type { TastingNote, TeaId } from "@repo/core";
import { recordTasting } from "@repo/core";
import { AppLive } from "@repo/infra";
import { Effect } from "effect";
import type { ActionResult } from "../lib/actions/result";
import { runAction } from "../lib/actions/run-action";

export async function recordTastingAction(
  _prev: ActionResult<TastingNote> | null,
  formData: FormData,
): Promise<ActionResult<TastingNote>> {
  const teaId = String(formData.get("teaId") ?? "") as TeaId;
  const rating = Number(formData.get("rating") ?? 0);
  const notesValue = String(formData.get("notes") ?? "");
  const notes = notesValue === "" ? null : notesValue;

  const program = recordTasting({ teaId, rating, notes }).pipe(
    Effect.provide(AppLive),
  );

  return runAction(program);
}
