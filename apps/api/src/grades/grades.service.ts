import { Injectable } from '@nestjs/common';
import { CreateGradeScaleDto } from './dto/create-grade-scale.dto';

@Injectable()
export class GradesService {
  // In-memory storage for grade scales (could be moved to database later)
  private gradeScales: Map<string, any> = new Map();

  constructor() {
    // Initialize with default grade scale
    this.gradeScales.set('default', {
      id: 'default',
      name: 'Default Grade Scale',
      description: 'Standard A-F grading system',
      scales: [
        { grade: 'A+', minPercentage: 90, maxPercentage: 100, description: 'Excellent' },
        { grade: 'A', minPercentage: 80, maxPercentage: 89, description: 'Very Good' },
        { grade: 'B+', minPercentage: 70, maxPercentage: 79, description: 'Good' },
        { grade: 'B', minPercentage: 60, maxPercentage: 69, description: 'Above Average' },
        { grade: 'C', minPercentage: 50, maxPercentage: 59, description: 'Average' },
        { grade: 'D', minPercentage: 40, maxPercentage: 49, description: 'Below Average' },
        { grade: 'F', minPercentage: 0, maxPercentage: 39, description: 'Fail' },
      ],
    });
  }

  createGradeScale(tenantId: string, createGradeScaleDto: CreateGradeScaleDto) {
    const id = `${tenantId}-${Date.now()}`;
    const gradeScale = {
      id,
      tenantId,
      ...createGradeScaleDto,
      createdAt: new Date(),
    };
    this.gradeScales.set(id, gradeScale);
    return gradeScale;
  }

  findAllGradeScales(tenantId: string) {
    const scales = Array.from(this.gradeScales.values()).filter(
      (scale) => scale.id === 'default' || scale.tenantId === tenantId
    );
    return scales;
  }

  findOneGradeScale(id: string) {
    return this.gradeScales.get(id);
  }

  computeGrade(marks: number, maxMarks: number, gradeScaleId: string = 'default'): string {
    const percentage = (marks / maxMarks) * 100;
    const gradeScale = this.gradeScales.get(gradeScaleId);
    
    if (!gradeScale) {
      return 'N/A';
    }

    const scale = gradeScale.scales.find(
      (s: any) => percentage >= s.minPercentage && percentage <= s.maxPercentage
    );

    return scale ? scale.grade : 'N/A';
  }
}
