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
exports.FeeStructureController = void 0;
const common_1 = require("@nestjs/common");
const fee_structure_service_1 = require("./fee-structure.service");
const fee_structure_dto_1 = require("./dto/fee-structure.dto");
let FeeStructureController = class FeeStructureController {
    feeStructureService;
    constructor(feeStructureService) {
        this.feeStructureService = feeStructureService;
    }
    getStructure(sessionId, className) {
        return this.feeStructureService.getStructure(sessionId, className);
    }
    upsertStructure(sessionId, className, dto) {
        return this.feeStructureService.upsertStructure(sessionId, className, dto);
    }
    copyStructure(dto) {
        return this.feeStructureService.copyStructure(dto);
    }
};
exports.FeeStructureController = FeeStructureController;
__decorate([
    (0, common_1.Get)(':sessionId/:className'),
    (0, common_1.Header)('Cache-Control', 'no-store'),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('className')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], FeeStructureController.prototype, "getStructure", null);
__decorate([
    (0, common_1.Put)(':sessionId/:className'),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('className')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, fee_structure_dto_1.UpsertFeeStructureDto]),
    __metadata("design:returntype", void 0)
], FeeStructureController.prototype, "upsertStructure", null);
__decorate([
    (0, common_1.Post)('copy'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fee_structure_dto_1.CopyFeeStructureDto]),
    __metadata("design:returntype", void 0)
], FeeStructureController.prototype, "copyStructure", null);
exports.FeeStructureController = FeeStructureController = __decorate([
    (0, common_1.Controller)('fee-structure'),
    __metadata("design:paramtypes", [fee_structure_service_1.FeeStructureService])
], FeeStructureController);
//# sourceMappingURL=fee-structure.controller.js.map