import { InvalidRating } from "@repo/core";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";
import { runAction } from "../lib/actions/run-action";

describe("runAction", () => {
  it("maps a success to { status: 'success', data }", async () => {
    const result = await runAction(Effect.succeed(42));

    expect(result).toEqual({ status: "success", data: 42 });
  });

  it("maps a typed Fail to an operational error with its tag and message", async () => {
    const result = await runAction(
      Effect.fail(new InvalidRating({ rating: 9 })),
    );

    expect(result).toEqual({
      status: "error",
      error: {
        tag: "InvalidRating",
        userMessage: "Rating must be between 1 and 5.",
        isOperational: true,
      },
    });
  });

  it("maps a Defect to INTERNAL, hides the message, and reports via onError", async () => {
    const onError = vi.fn();
    const result = await runAction(
      Effect.die(new Error("driver: connection reset")),
      { onError },
    );

    expect(result).toEqual({
      status: "error",
      error: {
        tag: "INTERNAL",
        userMessage: "Something went wrong.",
        isOperational: false,
      },
    });
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
