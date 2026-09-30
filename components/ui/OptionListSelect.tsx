"use client";

import { useMemo } from "react";
import { Select, type SelectProps } from "antd";
import { useOptionList } from "@/lib/hooks/useOptionList";
import {
  type OptionListKey,
  type OptionRow,
} from "@/lib/config/optionLists";

export interface OptionListSelectProps
  extends Omit<SelectProps, "options" | "loading" | "value" | "onChange"> {
  /** Registered option list key (see `OPTION_LIST_KEYS`). */
  listKey: OptionListKey;
  value?: SelectProps["value"];
  onChange?: SelectProps["onChange"];
  /** Group rows by their `group` field when at least one row carries one. */
  groupBy?: boolean;
  /** Extra rows to exclude (e.g. values already chosen elsewhere). */
  exclude?: readonly string[];
  /** Append the row description to the label (e.g. "Digital Services - Web dev"). */
  showDescription?: boolean;
  /** Rendered when both the DB row and the code fallback are empty. */
  emptyText?: string;
}

function toAntdOptions(
  rows: readonly OptionRow[],
  groupBy: boolean,
  exclude?: readonly string[],
  showDescription = false,
): SelectProps["options"] {
  const filtered = exclude?.length ? rows.filter((row) => !exclude.includes(row.value)) : rows;
  const labelFor = (row: OptionRow) =>
    showDescription && row.description ? `${row.label} — ${row.description}` : row.label;

  if (!groupBy) {
    return filtered.map((row) => ({
      value: row.value,
      label: labelFor(row),
      disabled: row.hidden === true,
      title: row.description ?? row.label,
    }));
  }

  const groups = new Map<string, OptionRow[]>();
  for (const row of filtered) {
    const name = row.group ?? "";
    const bucket = groups.get(name);
    if (bucket) bucket.push(row);
    else groups.set(name, [row]);
  }

  return Array.from(groups.entries()).map(([name, members]) => ({
    label: name || "Other",
    options: members.map((row) => ({
      value: row.value,
      label: labelFor(row),
      disabled: row.hidden === true,
    })),
  }));
}

/**
 * Dropdown bound to an admin-editable option list.
 *
 * Always has options: it seeds from the code fallback and upgrades to the
 * server payload, so a DB outage can never render a broken or empty control
 * (unless the list is genuinely empty — then an explicit empty state shows).
 */
export function OptionListSelect({
  listKey,
  groupBy = false,
  exclude,
  showDescription = false,
  emptyText = "No options available",
  placeholder,
  ...props
}: OptionListSelectProps) {
  const { visible, loading } = useOptionList(listKey);

  const options = useMemo(
    () => toAntdOptions(visible, groupBy, exclude, showDescription),
    [visible, groupBy, exclude, showDescription],
  );

  return (
    <Select
      {...props}
      loading={loading}
      placeholder={placeholder ?? "Select an option"}
      options={options}
      notFoundContent={loading ? "Loading…" : emptyText}
      showSearch
      optionFilterProp="label"
      className={props.className}
    />
  );
}

export default OptionListSelect;
