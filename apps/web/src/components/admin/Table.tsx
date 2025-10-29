import { Icon } from "@iconify/react";
import styles from "./table.module.scss";

interface Column<T> {
  key: string;
  title: string;
  render?: (value: any, record: T) => React.ReactNode;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (record: T) => void;
}

export function Table<T extends { _id: string }>({
  columns,
  data,
  loading = false,
  onRowClick,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className={styles.loading}>
        <Icon icon="mdi:loading" className={styles.spinner} />
        <p>Đang tải...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={styles.empty}>
        <Icon icon="mdi:inbox" />
        <p>Không có dữ liệu</p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width }}>
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((record) => (
            <tr
              key={record._id}
              onClick={() => onRowClick?.(record)}
              className={onRowClick ? styles.clickable : ""}
            >
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render
                    ? col.render((record as any)[col.key], record)
                    : (record as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
