import styles from "./Breadcrumb.module.scss";
import React from "react";
import Link from "next/link";
import { ChevronRight, Home, MapPin, Tag } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  position?: number;
}

interface BreadcrumbProps {
  categoryName?: string;
  categorySlug?: string;
  categoryId?: string;
  address?: string;
  postTitle?: string;
  items?: BreadcrumbItem[];
  showIcons?: boolean;
}

/**
 * Breadcrumb component cho marketplace Say2hand
 * Hiển thị navigation path: Trang chủ > Danh mục > Khu vực > Sản phẩm
 * SEO-friendly với structured data
 */
const Breadcrumb: React.FC<BreadcrumbProps> = ({
  categoryName,
  categorySlug,
  categoryId,
  address,
  postTitle,
  items,
  showIcons = true,
}) => {
  // Truncate long text for better UX
  const truncate = (text: string, maxLength: number = 30) => {
    if (!text) return "";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  // Build breadcrumb items cho post detail page
  const breadcrumbItems: BreadcrumbItem[] = items || [
    {
      label: "Trang chủ",
      href: "/home",
      icon: showIcons ? <Home className={styles["icon"]} /> : undefined,
      position: 1,
    },
    ...(categoryName
      ? [
          {
            label: categoryName,
            href: categorySlug
              ? `/search?category=${categorySlug}`
              : categoryId
                ? `/search?category_id=${categoryId}`
                : "/search",
            icon: showIcons ? <Tag className={styles["icon"]} /> : undefined,
            position: 2,
          },
        ]
      : []),
    ...(address
      ? [
          {
            label: truncate(address, 25),
            href: `/search?location=${encodeURIComponent(address)}`,
            icon: showIcons ? <MapPin className={styles["icon"]} /> : undefined,
            position: 3,
          },
        ]
      : []),
    ...(postTitle
      ? [
          {
            label: truncate(postTitle, 40),
            position: 4,
          },
        ]
      : []),
  ];

  // Generate structured data cho SEO (JSON-LD)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: item.position || index + 1,
      name: item.label,
      ...(item.href && {
        item: `${typeof window !== "undefined" ? window.location.origin : ""}${item.href}`,
      }),
    })),
  };

  return (
    <>
      {/* Structured Data cho SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <nav className={styles["breadcrumb"]} aria-label="Breadcrumb navigation">
        <ol
          className={styles["breadcrumb-list"]}
          itemScope
          itemType="https://schema.org/BreadcrumbList"
        >
          {breadcrumbItems.map((item, index) => (
            <li
              key={index}
              className={styles["breadcrumb-item"]}
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {item.href ? (
                <Link
                  href={item.href}
                  className={styles["breadcrumb-link"]}
                  itemProp="item"
                  title={item.label}
                >
                  {item.icon && (
                    <span className={styles["icon-wrapper"]}>{item.icon}</span>
                  )}
                  <span itemProp="name">{item.label}</span>
                  <meta
                    itemProp="position"
                    content={String(item.position || index + 1)}
                  />
                </Link>
              ) : (
                <span className={styles["breadcrumb-current"]} itemProp="item">
                  {item.icon && (
                    <span className={styles["icon-wrapper"]}>{item.icon}</span>
                  )}
                  <span itemProp="name">{item.label}</span>
                  <meta
                    itemProp="position"
                    content={String(item.position || index + 1)}
                  />
                </span>
              )}
              {index < breadcrumbItems.length - 1 && (
                <ChevronRight
                  className={styles["separator"]}
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumb;
