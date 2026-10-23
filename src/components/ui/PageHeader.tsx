"use client";

import React from "react";
import Link from "next/link";
import { Breadcrumb, Button, Space, Typography } from "antd";
import type { BreadcrumbProps } from "antd";

export interface ErpPageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbProps["items"];
  extra?: React.ReactNode;
  primaryAction?: { label: string; onClick?: () => void; href?: string; disabled?: boolean };
}

/** Consistent title, context and primary-action area for future dedicated routes. */
export function PageHeader({ title, description, breadcrumbs, extra, primaryAction }: ErpPageHeaderProps) {
  return (
    <section className="erp-page-header">
      {breadcrumbs?.length ? <Breadcrumb items={breadcrumbs} /> : null}
      <div className="erp-page-header__body">
        <div>
          <Typography.Title level={2}>{title}</Typography.Title>
          {description ? <Typography.Paragraph type="secondary">{description}</Typography.Paragraph> : null}
        </div>
        <Space wrap>
          {extra}
          {primaryAction?.href ? (
            <Link href={primaryAction.href}><Button type="primary" disabled={primaryAction.disabled}>{primaryAction.label}</Button></Link>
          ) : primaryAction ? (
            <Button type="primary" onClick={primaryAction.onClick} disabled={primaryAction.disabled}>{primaryAction.label}</Button>
          ) : null}
        </Space>
      </div>
    </section>
  );
}
