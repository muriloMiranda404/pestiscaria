import { cloneElement, isValidElement, type ReactNode } from "react";
import type { Status } from "@/types/domain";
import { publication } from "@/features/admin/format";

export function Heading({title, description, action}: {title: string; description?: string; action?: ReactNode}) {
  return <div className="adm-heading"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}
export function Empty({children}: {children: ReactNode}) {
  return <div className="adm-empty">{children}</div>;
}
export function StatusBadge({status}: {status: Status}) {
  return <span className={`adm-badge adm-${status}`}>{publication[status]}</span>;
}
export function Field({label, children, hint, wide = false}: {label: string; children: ReactNode; hint?: string; wide?: boolean}) {
  const input = isValidElement(children) ? cloneElement(children as React.ReactElement<{ "aria-label"?: string }>, { "aria-label": label }) : children;
  return <label className={`adm-field${wide ? " adm-wide" : ""}`}><span>{label}</span>{input}{hint && <small>{hint}</small>}</label>;
}
export function Notice({text, error = false}: {text: string; error?: boolean}) {
  return text ? <p className={`adm-flash ${error ? "error" : "success"}`} role={error ? "alert" : "status"}>{text}</p> : null;
}
