import styles from "./Breadcrumb.module.scss";
// Breadcrumb.tsx - Component hiển thị breadcrumb điều hướng
import React from "react";

interface BreadcrumbProps {
  categoryName: string;
  address: string;
}

// Component hiển thị breadcrumb
const Breadcrumb: React.FC<BreadcrumbProps> = ({ categoryName, address }) => {
  return (
    <p className={styles["breadcrumb"]}>
      Say2hand &gt; {categoryName || ""} &gt; {address}
    </p>
  );
};

export default Breadcrumb;
