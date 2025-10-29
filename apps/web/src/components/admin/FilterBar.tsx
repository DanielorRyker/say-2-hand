import { Icon } from "@iconify/react";
import { useState, useRef, useEffect } from "react";
import styles from "./filter-bar.module.scss";

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface FilterBarProps {
  filters: {
    label: string;
    key: string;
    options: FilterOption[];
    multiple?: boolean;
  }[];
  activeFilters: Record<string, string | string[]>;
  onFilterChange: (key: string, value: string | string[]) => void;
  onClearAll: () => void;
}

export function FilterBar({
  filters,
  activeFilters,
  onFilterChange,
  onClearAll,
}: FilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasActiveFilters = Object.values(activeFilters).some((value) =>
    Array.isArray(value) ? value.length > 0 : value !== ""
  );

  const toggleDropdown = (key: string) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

  const handleOptionClick = (
    filterKey: string,
    value: string,
    multiple?: boolean
  ) => {
    if (multiple) {
      const currentValues = (activeFilters[filterKey] as string[]) || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      onFilterChange(filterKey, newValues);
    } else {
      onFilterChange(filterKey, value);
      setOpenDropdown(null);
    }
  };

  const getActiveFilterLabel = (filter: (typeof filters)[0]) => {
    const activeValue = activeFilters[filter.key];
    if (!activeValue) return filter.label;

    if (Array.isArray(activeValue)) {
      if (activeValue.length === 0) return filter.label;
      if (activeValue.length === 1) {
        const option = filter.options.find(
          (opt) => opt.value === activeValue[0]
        );
        return option?.label || filter.label;
      }
      return `${filter.label} (${activeValue.length})`;
    }

    const option = filter.options.find((opt) => opt.value === activeValue);
    return option?.label || filter.label;
  };

  return (
    <div className={styles.filterBar}>
      <div className={styles.filterList}>
        <div className={styles.filterIcon}>
          <Icon icon="mdi:filter-variant" />
          <span>Bộ lọc:</span>
        </div>

        {filters.map((filter) => (
          <div
            key={filter.key}
            className={styles.filterDropdown}
            ref={openDropdown === filter.key ? dropdownRef : null}
          >
            <button
              className={`${styles.filterButton} ${
                activeFilters[filter.key] &&
                (Array.isArray(activeFilters[filter.key])
                  ? (activeFilters[filter.key] as string[]).length > 0
                  : activeFilters[filter.key] !== "")
                  ? styles.active
                  : ""
              }`}
              onClick={() => toggleDropdown(filter.key)}
            >
              {getActiveFilterLabel(filter)}
              <Icon icon="mdi:chevron-down" />
            </button>

            {openDropdown === filter.key && (
              <div className={styles.dropdownMenu}>
                {filter.options.map((option) => {
                  const isSelected = filter.multiple
                    ? ((activeFilters[filter.key] as string[]) || []).includes(
                        option.value
                      )
                    : activeFilters[filter.key] === option.value;

                  return (
                    <button
                      key={option.value}
                      className={`${styles.dropdownItem} ${isSelected ? styles.selected : ""}`}
                      onClick={() =>
                        handleOptionClick(
                          filter.key,
                          option.value,
                          filter.multiple
                        )
                      }
                    >
                      {filter.multiple && (
                        <div className={styles.checkbox}>
                          {isSelected && <Icon icon="mdi:check" />}
                        </div>
                      )}
                      <span>{option.label}</span>
                      {option.count !== undefined && (
                        <span className={styles.count}>({option.count})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {hasActiveFilters && (
        <button className={styles.clearButton} onClick={onClearAll}>
          <Icon icon="mdi:close-circle" />
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
}
