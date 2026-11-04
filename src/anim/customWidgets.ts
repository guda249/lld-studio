import type { ComponentType } from "react";
import type { Action } from "./types";
import { RideWidget, RetryWidget, ShipWidget, SortWidget } from "../content/patterns/strategy/widgets";

export interface CustomWidgetProps {
  /** Play these actions on the example's mini diagram and show the caption. */
  onPlay: (actions: Action[], caption: string) => void;
  /** Changes when a walkthrough starts: the widget goes back to its first option and default inputs. */
  resetSignal: number;
}

/** Hand-built Try-it widgets (the approved Strategy prototype). Every other example uses the generic Try it. */
export const CUSTOM_WIDGETS: Record<string, ComponentType<CustomWidgetProps>> = {
  "strategy-ride": RideWidget,
  "strategy-sort": SortWidget,
  "strategy-ship": ShipWidget,
  "strategy-retry": RetryWidget
};

/** Node the "active" ring starts on before anything is picked. */
export const CUSTOM_INITIAL_RING: Record<string, string> = {
  "strategy-ride": "s0",
  "strategy-sort": "s0",
  "strategy-ship": "s0",
  "strategy-retry": "s0"
};
