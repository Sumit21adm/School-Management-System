"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExaminationModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const exam_types_controller_1 = require("./controllers/exam-types.controller");
const subjects_controller_1 = require("./controllers/subjects.controller");
const exams_controller_1 = require("./controllers/exams.controller");
const exam_types_service_1 = require("./services/exam-types.service");
const subjects_service_1 = require("./services/subjects.service");
const exams_service_1 = require("./services/exams.service");
let ExaminationModule = class ExaminationModule {
};
exports.ExaminationModule = ExaminationModule;
exports.ExaminationModule = ExaminationModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            exam_types_controller_1.ExamTypesController,
            subjects_controller_1.SubjectsController,
            exams_controller_1.ExamsController
        ],
        providers: [
            prisma_service_1.PrismaService,
            exam_types_service_1.ExamTypesService,
            subjects_service_1.SubjectsService,
            exams_service_1.ExamsService
        ]
    })
], ExaminationModule);
//# sourceMappingURL=examination.module.js.map