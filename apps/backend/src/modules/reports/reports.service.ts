import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportDocument } from './schemas/report.schema';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
  ) {}

  async create(createReportDto: CreateReportDto): Promise<Report> {
    const newReport = new this.reportModel(createReportDto);
    return newReport.save();
  }

  async findAll(status?: string): Promise<Report[]> {
    const query = status ? { status } : {};
    return this.reportModel
      .find(query)
      .populate('reporter_id', 'full_name avatar email')
      .populate('resolved_by', 'full_name avatar email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Report | null> {
    return this.reportModel
      .findById(id)
      .populate('reporter_id', 'full_name avatar email')
      .populate('resolved_by', 'full_name avatar email')
      .exec();
  }

  async update(
    id: string,
    updateReportDto: UpdateReportDto,
  ): Promise<Report | null> {
    const updateData: any = { ...updateReportDto };

    if (
      updateReportDto.status === 'resolved' ||
      updateReportDto.status === 'invalid'
    ) {
      updateData.resolved_at = new Date();
    }

    return this.reportModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('reporter_id', 'full_name avatar email')
      .populate('resolved_by', 'full_name avatar email')
      .exec();
  }

  async remove(id: string): Promise<Report | null> {
    return this.reportModel.findByIdAndDelete(id).exec();
  }

  async getStatistics() {
    const [total, newReports, inReview, resolved, invalid] = await Promise.all([
      this.reportModel.countDocuments(),
      this.reportModel.countDocuments({ status: 'new' }),
      this.reportModel.countDocuments({ status: 'in_review' }),
      this.reportModel.countDocuments({ status: 'resolved' }),
      this.reportModel.countDocuments({ status: 'invalid' }),
    ]);

    return {
      total,
      new: newReports,
      in_review: inReview,
      resolved,
      invalid,
    };
  }

  async findByTargetId(
    targetType: string,
    targetId: string,
  ): Promise<Report[]> {
    return this.reportModel
      .find({ target_type: targetType, target_id: targetId })
      .populate('reporter_id', 'full_name avatar email')
      .sort({ createdAt: -1 })
      .exec();
  }
}
