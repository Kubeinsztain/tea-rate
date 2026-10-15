"use client";

import { useActionState } from "react";
import { type ActionResult, recordTastingAction } from "./actions";

const initial: ActionResult = { ok: false, message: "" };

export function RecordTastingForm() {
  const [state, formAction, pending] = useActionState(
    recordTastingAction,
    initial,
  );

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div>
        <label
          htmlFor="teaId"
          className="block text-sm font-medium text-stone-700"
        >
          Tea (catalog id)
        </label>
        <input
          id="teaId"
          name="teaId"
          required
          placeholder="e.g. a catalog tea id"
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="rating"
          className="block text-sm font-medium text-stone-700"
        >
          Rating (1–5)
        </label>
        <input
          id="rating"
          name="rating"
          type="number"
          min={1}
          max={5}
          required
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-stone-700"
        >
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Record tasting"}
      </button>

      {state.message ? (
        <p className={state.ok ? "text-green-700" : "text-red-700"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
