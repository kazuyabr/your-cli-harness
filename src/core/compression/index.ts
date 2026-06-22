// src/core/compression/index.ts

export { HeadroomCompressor } from "./headroom/index.js";
export type { CompressionResult as HeadroomCompressionResult } from "./headroom/index.js";

export { CavemanCompressor } from "./caveman/index.js";
export type { CompressionResult as CavemanCompressionResult } from "./caveman/index.js";
