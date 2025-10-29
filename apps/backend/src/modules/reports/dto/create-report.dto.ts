export class CreateReportDto {
  reporter_id: string;
  target_type: 'post' | 'user' | 'message' | 'comment';
  target_id: string;
  reason_code: string;
  description: string;
  evidence_urls?: string[];
  severity?: 'low' | 'medium' | 'high';
}
