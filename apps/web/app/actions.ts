"use server";

import type { TeaId } from "@repo/core";
import { InvalidRating, recordTasting, TeaNotFound } from "@repo/core";
import { AppLive } from "@repo/infra";
import { Effect } from "effect";

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function recordTastingAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const teaId = String(formData.get("teaId") ?? "") as TeaId;
  const rating = Number(formData.get("rating") ?? 0);
  const notesValue = String(formData.get("notes") ?? "");
  const notes = notesValue === "" ? null : notesValue;

  const program = recordTasting({ teaId, rating, notes }).pipe(
    Effect.provide(AppLive),
  );

  try {
    const note = await Effect.runPromise(program);
    return { ok: true, message: `Recorded ${note.rating}/5 for this tea.` };
  } catch (error) {
    if (error instanceof TeaNotFound) {
      return { ok: false, message: "That tea isn't in the catalog yet." };
    }
    if (error instanceof InvalidRating) {
      return { ok: false, message: "Rating must be between 1 and 5." };
    }
    return { ok: false, message: "Something went wrong saving your note." };
  }
}
