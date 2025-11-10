import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PromotionsService } from './promotions.service';
import { PromoteStudentsDto } from './dto/promote-students.dto';

@Controller('promotions')
@UseGuards(AuthGuard('jwt'))
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post('preview')
  getPromotionPreview(@Request() req: any, @Body() promoteStudentsDto: PromoteStudentsDto) {
    return this.promotionsService.getPromotionPreview(req.user.tenantId, promoteStudentsDto);
  }

  @Post('execute')
  promoteStudents(@Request() req: any, @Body() promoteStudentsDto: PromoteStudentsDto) {
    return this.promotionsService.promoteStudents(req.user.tenantId, promoteStudentsDto);
  }
}
