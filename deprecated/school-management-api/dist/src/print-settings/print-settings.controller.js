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
exports.PrintSettingsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const print_settings_service_1 = require("./print-settings.service");
const print_settings_dto_1 = require("./dto/print-settings.dto");
let PrintSettingsController = class PrintSettingsController {
    printSettingsService;
    constructor(printSettingsService) {
        this.printSettingsService = printSettingsService;
    }
    async get() {
        return this.printSettingsService.get();
    }
    async update(updateDto) {
        return this.printSettingsService.update(updateDto);
    }
    async uploadLogo(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const logoUrl = `/uploads/logos/${file.filename}`;
        await this.printSettingsService.updateLogoUrl(logoUrl);
        return {
            message: 'Logo uploaded successfully',
            logoUrl,
        };
    }
};
exports.PrintSettingsController = PrintSettingsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PrintSettingsController.prototype, "get", null);
__decorate([
    (0, common_1.Put)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [print_settings_dto_1.UpdatePrintSettingsDto]),
    __metadata("design:returntype", Promise)
], PrintSettingsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('logo'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('logo', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/logos',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = (0, path_1.extname)(file.originalname);
                cb(null, `school-logo-${uniqueSuffix}${ext}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                cb(new common_1.BadRequestException('Only image files are allowed'), false);
            }
            else {
                cb(null, true);
            }
        },
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PrintSettingsController.prototype, "uploadLogo", null);
exports.PrintSettingsController = PrintSettingsController = __decorate([
    (0, common_1.Controller)('print-settings'),
    __metadata("design:paramtypes", [print_settings_service_1.PrintSettingsService])
], PrintSettingsController);
//# sourceMappingURL=print-settings.controller.js.map