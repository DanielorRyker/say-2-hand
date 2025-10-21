"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import styles from "./CategoryDropdown.module.scss";
import { URL_GCS } from "@/lib/constants";
import Image from "next/image";
import { Icon } from "@iconify/react";

interface Category {
  _id: string;
  name: string;
  parent_id?: string | null;
  icon?: string;
  image?: string;
}

interface Props {
  categories: Category[];
  value?: string; // selected category id
  onChange: (id: string | null) => void;
  placeholder?: string;
}

export default function CategoryDropdown({
  categories = [],
  value,
  onChange,
  placeholder = "Chọn danh mục",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const parents = categories.filter((c) => !c.parent_id);
  const children = categories.filter((c) => c.parent_id);

  const flattened = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // list parents then children (children follow their parent in list)
      const out: Category[] = [];
      parents.forEach((p) => {
        out.push(p);
        children
          .filter((ch) => ch.parent_id === p._id)
          .forEach((ch) => out.push(ch));
      });
      return out;
    }
    // filter by query on name
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, query, parents, children]);

  const selected = categories.find((c) => c._id === value);

  const imageLoader = ({ src }: { src: string }) => {
    if (!src) return "/image/category/default.svg";
    if (src.startsWith("http") || src.startsWith("/")) return src;
    if (URL_GCS) return URL_GCS + src;
    return src;
  };

  return (
    <div className={styles.dropdownRoot} ref={rootRef}>
      {open ? (
        <div
          className={styles.trigger}
          onClick={() => setOpen((s) => !s)}
          role="button"
          tabIndex={0}
          aria-haspopup="listbox"
          aria-expanded="true"
        >
          <div className={styles.triggerLabel}>
            {selected ? (
              <>
                <span className={styles.optionIcon}>
                  {selected?.icon ? (
                    <Icon icon={selected.icon} width={16} height={16} />
                  ) : (
                    <Image
                      loader={imageLoader}
                      src={selected?.image ?? "/image/category/default.svg"}
                      alt={selected?.name ?? ""}
                      width={24}
                      height={24}
                      className={styles.optionImg}
                    />
                  )}
                </span>
                <span>{selected.name}</span>
              </>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <Icon icon="mdi:chevron-up" width={20} height={20} />
        </div>
      ) : (
        <div
          className={styles.trigger}
          onClick={() => setOpen((s) => !s)}
          role="button"
          tabIndex={0}
          aria-haspopup="listbox"
          aria-expanded="false"
        >
          <div className={styles.triggerLabel}>
            {selected ? (
              <>
                <span className={styles.optionIcon}>
                  {selected?.icon ? (
                    <Icon icon={selected.icon} width={16} height={16} />
                  ) : (
                    <Image
                      loader={imageLoader}
                      src={selected?.image ?? "/image/category/default.svg"}
                      alt={selected?.name ?? ""}
                      width={24}
                      height={24}
                      className={styles.optionImg}
                    />
                  )}
                </span>
                <span>{selected.name}</span>
              </>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <Icon icon="mdi:chevron-down" width={20} height={20} />
        </div>
      )}

      {open && (
        <div className={styles.menu} aria-label="Danh mục">
          <div className={styles.searchBox}>
            <input
              className={styles.searchInput}
              placeholder="Tìm danh mục..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div>
            <div
              className={styles.option}
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              <span className={styles.optionIcon}>
                <Icon icon="mdi:shape" width={16} height={16} />
              </span>
              <span className={styles.allOption}>Tất cả</span>
            </div>
            {flattened.length === 0 && (
              <div className={styles.noResults}>Không có kết quả</div>
            )}
            {flattened.map((opt) => {
              const isChild = !!opt.parent_id;
              return (
                <div
                  key={opt._id}
                  className={`${styles.option} ${isChild ? styles.childOption : ""}`}
                  onClick={() => {
                    onChange(opt._id);
                    setOpen(false);
                  }}
                >
                  <span className={styles.optionIcon}>
                    {opt.icon ? (
                      <Icon icon={opt.icon} width={16} height={16} />
                    ) : (
                      <Image
                        loader={imageLoader}
                        src={opt.image ?? "/image/category/default.svg"}
                        alt={opt.name}
                        width={20}
                        height={20}
                        className={styles.optionImg}
                      />
                    )}
                  </span>
                  <span>{opt.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
