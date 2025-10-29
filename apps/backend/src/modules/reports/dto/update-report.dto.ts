export class UpdateReportDto {
  status?: 'new' | 'in_review' | 'resolved' | 'invalid';
  resolved_by?: string;
  action_taken?: string;
  resolved_at?: Date;
}
