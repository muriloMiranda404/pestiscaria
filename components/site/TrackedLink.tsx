"use client";

import type { ComponentProps } from "react";
import type { MetricKind } from "@/types/domain";
import { track } from "@/components/site/Metrics";

type Props = ComponentProps<"a"> & { kind: MetricKind; subject?: string };

export function TrackedLink({ kind, subject = "", onClick, ...props }: Props) {
  return <a {...props} onClick={event => { track(kind, subject); onClick?.(event); }} />;
}
