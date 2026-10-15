import type { NewTea } from "@repo/core";
import { TeaRepository } from "@repo/core";
import { Effect } from "effect";
import { AppLive } from "../index";

const seedTeas: NewTea[] = [
  { name: "Sencha", type: "green", vendor: null, region: "Uji, Japan" },
  {
    name: "Darjeeling First Flush",
    type: "black",
    vendor: null,
    region: "Darjeeling, India",
  },
  { name: "Da Hong Pao", type: "oolong", vendor: null, region: "Wuyi, China" },
];

const program = Effect.gen(function* () {
  const teaRepo = yield* TeaRepository;
  for (const tea of seedTeas) {
    yield* teaRepo.insert(tea);
  }
});

Effect.runPromise(program.pipe(Effect.provide(AppLive))).then(
  () => console.log(`Seeded ${seedTeas.length} teas.`),
  (error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  },
);
