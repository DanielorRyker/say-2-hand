/**
 * QUICK REFERENCE: Admin Components
 *
 * This file serves as a quick reference guide for using the admin components.
 * It contains code examples and usage patterns for all available components.
 *
 * Note: This is a documentation file with examples, not actual runnable code.
 */

/*
============================================
1. IMPORT COMPONENTS
============================================

import {
  Table,
  Pagination,
  FilterBar,
  StatusBadge,
  ConfirmDialog
} from "@/components/admin";

============================================
2. TABLE COMPONENT
============================================

const columns = [
  { key: "name", title: "Tên", label: "Tên" },
  { 
    key: "status", 
    title: "Trạng thái",
    label: "Trạng thái",
    render: (_: any, item: any) => <StatusBadge status={item.status} />
  }
];

<Table
  data={items}
  columns={columns}
  loading={loading}
  onRowClick={(item) => console.log(item)}
/>

============================================
3. PAGINATION COMPONENT
============================================

const pageSize = 10;
const totalPages = Math.ceil(data.length / pageSize);

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  maxVisible={5}
/>

============================================
4. FILTER BAR COMPONENT
============================================

const filters = [
  {
    label: "Trạng thái",
    key: "status",
    options: [
      { label: "Tất cả", value: "" },
      { label: "Hoạt động", value: "active", count: 100 }
    ]
  }
];

<FilterBar
  filters={filters}
  activeFilters={activeFilters}
  onFilterChange={(key, val) => setActiveFilters({...activeFilters, [key]: val})}
  onClearAll={() => setActiveFilters({})}
/>

============================================
5. STATUS BADGE COMPONENT
============================================

<StatusBadge status="success" />
<StatusBadge status="pending" label="Chờ duyệt" />
<StatusBadge status="error" size="large" icon="mdi:alert" />

Available status types:
- success, warning, error, info, pending
- active, inactive, banned, approved, rejected

============================================
6. CONFIRM DIALOG COMPONENT
============================================

const [showDialog, setShowDialog] = useState(false);

<ConfirmDialog
  isOpen={showDialog}
  title="Xóa người dùng"
  message="Bạn có chắc chắn?"
  type="danger"
  confirmText="Xóa"
  cancelText="Hủy"
  onConfirm={handleDelete}
  onCancel={() => setShowDialog(false)}
/>

Types: danger, warning, info, success

============================================
7. COMPLETE EXAMPLE
============================================

"use client";
import { useState, useEffect } from "react";
import {
  Table,
  Pagination,
  FilterBar,
  StatusBadge,
  ConfirmDialog
} from "@/components/admin";

export default function MyAdminPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const pageSize = 10;
  const filteredData = data.filter((item: any) => 
    !filters.status || item.status === filters.status
  );
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  const columns = [
    { key: "name", title: "Tên", label: "Tên" },
    { 
      key: "status", 
      title: "Trạng thái",
      label: "Trạng thái",
      render: (_: any, item: any) => <StatusBadge status={item.status} />
    }
  ];
  
  const filterConfig = [
    {
      label: "Trạng thái",
      key: "status",
      options: [
        { label: "Tất cả", value: "" },
        { label: "Hoạt động", value: "active" },
        { label: "Không hoạt động", value: "inactive" }
      ]
    }
  ];
  
  const handleDelete = () => {
    // Delete logic here
  };
  
  return (
    <div>
      <h1>Quản lý</h1>
      
      <FilterBar
        filters={filterConfig}
        activeFilters={filters}
        onFilterChange={(key, val) => setFilters({...filters, [key]: val})}
        onClearAll={() => setFilters({})}
      />
      
      <Table
        data={paginatedData}
        columns={columns}
        loading={loading}
      />
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Xóa"
        message="Bạn có chắc?"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}

*/

export {};
