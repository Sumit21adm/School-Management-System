"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const admissions_service_1 = require("./admissions.service");
const multer_1 = require("multer");
const path_1 = require("path");
let AdmissionsController = class AdmissionsController {
    admissionsService;
    constructor(admissionsService) {
        this.admissionsService = admissionsService;
    }
    async create(createAdmissionDto, file) {
        if (file) {
            createAdmissionDto.photoUrl = `/uploads/photos/${file.filename}`;
        }
        const optionalFields = ['email', 'aadharCardNo', 'fatherOccupation', 'motherOccupation', 'whatsAppNo', 'subjects', 'photoUrl'];
        optionalFields.forEach(field => {
            if (createAdmissionDto[field] === '') {
                createAdmissionDto[field] = null;
            }
        });
        if (createAdmissionDto.dob) {
            createAdmissionDto.dob = new Date(createAdmissionDto.dob);
        }
        if (createAdmissionDto.admissionDate) {
            createAdmissionDto.admissionDate = new Date(createAdmissionDto.admissionDate);
        }
        delete createAdmissionDto.photo;
        try {
            return await this.admissionsService.create(createAdmissionDto);
        }
        catch (error) {
            console.error('Error creating admission:', error);
            if (error.code === 'P2002') {
                const target = error.meta?.target;
                throw new common_1.ConflictException(`Duplicate entry for ${target}. This value already exists.`);
            }
            throw new common_1.InternalServerErrorException(`Failed to create admission: ${error.message}`);
        }
    }
    async downloadTemplate(res) {
        const buffer = await this.admissionsService.generateTemplate();
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename=student_import_template.xlsx',
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
    async importStudents(file) {
        return this.admissionsService.importStudents(file);
    }
    async export(className, section, format, res) {
        const buffer = await this.admissionsService.exportStudents({ class: className, section, format });
        if (format === 'excel') {
            res.set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="students.xlsx"',
                'Content-Length': buffer.length,
            });
        }
        else {
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="students.pdf"',
                'Content-Length': buffer.length,
            });
        }
        res.end(buffer);
    }
    getAvailableSections(className) {
        return this.admissionsService.getAvailableSections(className);
    }
    getDashboardStats() {
        return this.admissionsService.getDashboardStats();
    }
    async findAll(search, className, section, status, sessionId, page, limit, sortBy, order) {
        return this.admissionsService.findAll({
            search,
            className,
            section,
            status,
            sessionId: sessionId ? parseInt(sessionId) : undefined,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            sortBy,
            order,
        });
    }
    findOne(id) {
        return this.admissionsService.findOne(+id);
    }
    async update(id, updateAdmissionDto, file) {
        if (file) {
            updateAdmissionDto.photoUrl = `/uploads/photos/${file.filename}`;
        }
        const optionalFields = ['email', 'aadharCardNo', 'fatherOccupation', 'motherOccupation', 'whatsAppNo', 'subjects', 'photoUrl'];
        optionalFields.forEach(field => {
            if (updateAdmissionDto[field] === '') {
                updateAdmissionDto[field] = null;
            }
        });
        if (updateAdmissionDto.dob) {
            updateAdmissionDto.dob = new Date(updateAdmissionDto.dob);
        }
        if (updateAdmissionDto.admissionDate) {
            updateAdmissionDto.admissionDate = new Date(updateAdmissionDto.admissionDate);
        }
        delete updateAdmissionDto.photo;
        try {
            return await this.admissionsService.update(+id, updateAdmissionDto);
        }
        catch (error) {
            console.error('Error updating admission:', error);
            if (error.code === 'P2002') {
                const target = error.meta?.target;
                throw new common_1.ConflictException(`Duplicate entry for ${target}. This value already exists.`);
            }
            throw new common_1.InternalServerErrorException(`Failed to update admission: ${error.message}`);
        }
    }
    remove(id) {
        return this.admissionsService.remove(+id);
    }
    restore(id) {
        return this.admissionsService.restore(+id);
    }
};
exports.AdmissionsController = AdmissionsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/photos',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
            }
        })
    })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdmissionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('template'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdmissionsController.prototype, "downloadTemplate", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdmissionsController.prototype, "importStudents", null);
__decorate([
    (0, common_1.Get)('export'),
    __param(0, (0, common_1.Query)('class')),
    __param(1, (0, common_1.Query)('section')),
    __param(2, (0, common_1.Query)('format')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AdmissionsController.prototype, "export", null);
__decorate([
    (0, common_1.Get)('sections/:className'),
    __param(0, (0, common_1.Param)('className')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdmissionsController.prototype, "getAvailableSections", null);
__decorate([
    (0, common_1.Get)('dashboard-stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdmissionsController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('className')),
    __param(2, (0, common_1.Query)('section')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('sessionId')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __param(7, (0, common_1.Query)('sortBy')),
    __param(8, (0, common_1.Query)('order')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdmissionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdmissionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/photos',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
            }
        })
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdmissionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdmissionsController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/restore'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdmissionsController.prototype, "restore", null);
exports.AdmissionsController = AdmissionsController = __decorate([
    (0, common_1.Controller)('admissions'),
    __metadata("design:paramtypes", [admissions_service_1.AdmissionsService])
], AdmissionsController);
//# sourceMappingURL=admissions.controller.js.map