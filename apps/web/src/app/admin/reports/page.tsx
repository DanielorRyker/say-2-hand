"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import axios from "axios";
import Image from "next/image";
import styles from "./reports.module.scss";
import { API_BASE } from "@/lib/constants";

interface Report {
  _id: string;
  reporter_id: {
    _id: string;
    full_name: string;
    avatar?: string;
  };
  target_type: "post" | "user" | "message" | "comment";
  target_id: string;
  reason_code: string;
  description: string;
  evidence_urls?: string[];
  status: "new" | "in_review" | "resolved" | "invalid";
  severity?: "low" | "medium" | "high";
  resolved_by?: {
    _id: string;
    full_name: string;
  };
  resolved_at?: string;
  action_taken?: string;
  createdAt: string;
  updatedAt: string;
}

type TabType = "new" | "in_review" | "resolved" | "invalid";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("new");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionForm, setActionForm] = useState({
    action_taken: "",
    status: "resolved" as "resolved" | "invalid",
  });

  const router = useRouter();

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.warn("No access token found - redirecting to login");
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        // client-side redirect to login
        router.push("/auth/login");
        setReports([]);
        return;
      }

      const res = await axios.get(
        `${API_BASE}/api/reports?status=${activeTab}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setReports(res.data || []);
    } catch (error) {
      // Better error handling: if unauthorized, clear auth and redirect to login
      const err: any = error;
      if (err?.response?.status === 401) {
        console.warn(
          "Unauthorized fetching reports - clearing credentials and redirecting to login"
        );
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        router.push("/auth/login");
        return;
      }

      console.error("Error fetching reports:", error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, router]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResolveReport = async (reportId: string) => {
    if (!actionForm.action_taken.trim()) {
      alert("Vui lòng nhập hành động đã thực hiện");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!token) {
        alert("Bạn cần đăng nhập để thực hiện hành động này.");
        router.push("/auth/login");
        return;
      }

      await axios.patch(
        `${API_BASE}/api/reports/${reportId}`,
        {
          status: actionForm.status,
          action_taken: actionForm.action_taken,
          resolved_by: user._id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Đã xử lý báo cáo thành công");
      setSelectedReport(null);
      setActionForm({ action_taken: "", status: "resolved" });
      fetchReports();
    } catch (error) {
      const err: any = error;
      if (err?.response?.status === 401) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        router.push("/auth/login");
        return;
      }

      console.error("Error resolving report:", error);
      alert("Có lỗi xảy ra khi xử lý báo cáo");
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      default:
        return "#10b981";
    }
  };

  const getTargetTypeLabel = (type: string) => {
    switch (type) {
      case "post":
        return "Bài đăng";
      case "user":
        return "Người dùng";
      case "message":
        return "Tin nhắn";
      case "comment":
        return "Bình luận";
      default:
        return type;
    }
  };

  const tabs = [
    {
      key: "new",
      label: "Mới",
      icon: "mdi:bell-ring",
      count: reports.filter((r) => r.status === "new").length,
    },
    {
      key: "in_review",
      label: "Đang xử lý",
      icon: "mdi:progress-clock",
      count: 0,
    },
    {
      key: "resolved",
      label: "Đã giải quyết",
      icon: "mdi:check-circle",
      count: 0,
    },
    {
      key: "invalid",
      label: "Không hợp lệ",
      icon: "mdi:close-circle",
      count: 0,
    },
  ];

  return (
    <div className={styles.reportsPage}>
      <div className={styles.header}>
        <h1>
          <Icon icon="mdi:alert-octagon" />
          Quản lý Báo cáo Vi phạm
        </h1>
      </div>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.active : ""}`}
            onClick={() => setActiveTab(tab.key as TabType)}
          >
            <Icon icon={tab.icon} />
            <span>{tab.label}</span>
            {tab.count > 0 && <span className={styles.badge}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loading}>
          <Icon icon="mdi:loading" className={styles.spinner} />
          <p>Đang tải báo cáo...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className={styles.empty}>
          <Icon icon="mdi:inbox" />
          <p>Không có báo cáo nào</p>
        </div>
      ) : (
        <div className={styles.reportsList}>
          {reports.map((report) => (
            <div key={report._id} className={styles.reportCard}>
              <div className={styles.reportHeader}>
                <div className={styles.reporterInfo}>
                  <div className={styles.avatar}>
                    {report.reporter_id?.avatar ? (
                      <Image
                        src={report.reporter_id.avatar}
                        alt={report.reporter_id.full_name}
                        width={40}
                        height={40}
                      />
                    ) : (
                      <Icon icon="mdi:account-circle" />
                    )}
                  </div>
                  <div>
                    <p className={styles.name}>
                      {report.reporter_id?.full_name}
                    </p>
                    <p className={styles.date}>
                      {new Date(report.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
                <div className={styles.reportMeta}>
                  <span className={styles.targetType}>
                    {getTargetTypeLabel(report.target_type)}
                  </span>
                  {report.severity && (
                    <span
                      className={styles.severity}
                      style={{
                        backgroundColor: getSeverityColor(report.severity),
                      }}
                    >
                      {report.severity.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.reportContent}>
                <p className={styles.reason}>
                  <strong>Lý do:</strong> {report.reason_code}
                </p>
                <p className={styles.description}>{report.description}</p>

                {report.evidence_urls && report.evidence_urls.length > 0 && (
                  <div className={styles.evidence}>
                    <strong>Bằng chứng:</strong>
                    <div className={styles.evidenceImages}>
                      {report.evidence_urls.map((url, idx) => (
                        <Image
                          key={idx}
                          src={url}
                          alt={`Evidence ${idx + 1}`}
                          width={100}
                          height={100}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.reportActions}>
                {report.status === "new" && (
                  <button
                    className={styles.btnReview}
                    onClick={() => setSelectedReport(report)}
                  >
                    <Icon icon="mdi:eye" />
                    Xem & Xử lý
                  </button>
                )}
                {report.action_taken && (
                  <div className={styles.actionTaken}>
                    <Icon icon="mdi:information" />
                    <span>{report.action_taken}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal xử lý báo cáo */}
      {selectedReport && (
        <div className={styles.modal} onClick={() => setSelectedReport(null)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>Xử lý Báo cáo</h2>
              <button onClick={() => setSelectedReport(null)}>
                <Icon icon="mdi:close" />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Trạng thái</label>
                <select
                  value={actionForm.status}
                  onChange={(e) =>
                    setActionForm({
                      ...actionForm,
                      status: e.target.value as any,
                    })
                  }
                >
                  <option value="resolved">Đã giải quyết</option>
                  <option value="invalid">Không hợp lệ</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Hành động đã thực hiện *</label>
                <textarea
                  value={actionForm.action_taken}
                  onChange={(e) =>
                    setActionForm({
                      ...actionForm,
                      action_taken: e.target.value,
                    })
                  }
                  placeholder="Mô tả hành động đã thực hiện (khóa tài khoản, xóa bài, cảnh cáo...)"
                  rows={4}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.btnCancel}
                onClick={() => setSelectedReport(null)}
              >
                Hủy
              </button>
              <button
                className={styles.btnSubmit}
                onClick={() => handleResolveReport(selectedReport._id)}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
