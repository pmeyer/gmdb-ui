import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "./server";

Object.defineProperty(HTMLMediaElement.prototype, "pause", {
  configurable: true,
  value: function pause() {
    return undefined;
  },
});

Object.defineProperty(HTMLMediaElement.prototype, "play", {
  configurable: true,
  value: function play() {
    return Promise.resolve();
  },
});

beforeAll(() => {
  server.listen({
    onUnhandledRequest: "error",
  });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
