import type { Lang } from "../content/types";
import type { UmlModel } from "./types";

/** A review test case: code (and optionally a diagram) plus what the review must say about it. */
export interface ReviewCase {
  name: string;
  lang: Lang;
  code: string;
  diagram?: UmlModel;
  expect: {
    /** Must the pattern be recognised? */
    found: boolean;
    /** Finding ids that must appear. */
    ids?: string[];
    /** Finding ids that must NOT appear. */
    none?: string[];
  };
}
