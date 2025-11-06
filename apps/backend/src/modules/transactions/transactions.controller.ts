import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard) // Áp dụng guard cho toàn bộ controller
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(createTransactionDto);
  }

  @Get()
  findAll() {
    return this.transactionsService.findAll();
  }

  // Task 23: Lấy đơn hàng của người bán với pagination
  @Get('seller/:sellerId')
  getSellerOrders(
    @Param('sellerId') sellerId: string,
    @Query('status') status?: string,
    @Query() paginationDto?: PaginationDto,
  ) {
    return this.transactionsService.getSellerOrders(
      sellerId,
      status,
      paginationDto?.page,
      paginationDto?.limit,
    );
  }

  // Task 23: Lấy đơn hàng của người mua với pagination
  @Get('buyer/:buyerId')
  getBuyerOrders(
    @Param('buyerId') buyerId: string,
    @Query('status') status?: string,
    @Query() paginationDto?: PaginationDto,
  ) {
    return this.transactionsService.getBuyerOrders(
      buyerId,
      status,
      paginationDto?.page,
      paginationDto?.limit,
    );
  }

  // Lấy chi tiết đơn hàng
  @Get(':id/detail')
  getOrderDetail(@Param('id') id: string) {
    return this.transactionsService.getOrderDetail(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, updateTransactionDto);
  }

  // Huỷ đơn hàng và hoàn tiền
  @Post(':id/cancel')
  cancelOrder(
    @Param('id') id: string,
    @Body() body: { cancelReason?: string },
  ) {
    return this.transactionsService.cancelOrder(id, body.cancelReason);
  }

  // Xác nhận gửi hàng
  @Post(':id/ship')
  shipOrder(@Param('id') id: string) {
    return this.transactionsService.shipOrder(id);
  }

  // Xác nhận đã nhận hàng
  @Post(':id/complete')
  completeOrder(@Param('id') id: string) {
    return this.transactionsService.completeOrder(id);
  }

  // Admin: Lấy tất cả giao dịch với filter
  @Get('admin/all')
  getAllTransactionsForAdmin(@Query('status') status?: string) {
    return this.transactionsService.getAllTransactionsForAdmin(status);
  }

  // Admin: Lấy thống kê giao dịch
  @Get('admin/statistics')
  getTransactionStatistics() {
    return this.transactionsService.getTransactionStatistics();
  }

  // Admin: Cập nhật trạng thái giao dịch
  @Patch('admin/:id/status')
  updateTransactionStatus(
    @Param('id') id: string,
    @Body() body: { status: string; note?: string },
  ) {
    return this.transactionsService.updateTransactionStatus(
      id,
      body.status,
      body.note,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(id);
  }
}
