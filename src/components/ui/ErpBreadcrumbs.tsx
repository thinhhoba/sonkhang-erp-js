"use client";

import React from "react";
import { Breadcrumb } from "antd";
import { usePathname } from "next/navigation";
import { getRouteForPathname } from "@/config/routes";

const HOME_LABEL = "Tổng quan";

/** Automatic fallback breadcrumbs for legacy pages during the route migration. */
export function ErpBreadcrumbs({ currentLabel }: { currentLabel?: string }) {
  const pathname = usePathname();
  const route = getRouteForPathname(pathname);
  const label = currentLabel || route?.label;
  const items: Array<{ title: string; href?: string }> = [{ title: HOME_LABEL, href: "/dashboard" }];
  if (label && label !== HOME_LABEL) items.push({ title: label });
  return <Breadcrumb items={items} />;
}
