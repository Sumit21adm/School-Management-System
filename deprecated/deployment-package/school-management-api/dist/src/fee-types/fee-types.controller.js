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
exports.FeeTypesController = void 0;
const common_1 = require("@nestjs/common");
const fee_types_service_1 = require("./fee-types.service");
const fee_type_dto_1 = require("./dto/fee-type.dto");
let FeeTypesController = class FeeTypesController {
    feeTypesService;
    constructor(feeTypesService) {
        this.feeTypesService = feeTypesService;
    }
    findAll(activeOnly) {
        const active = activeOnly === 'false' ? false : true;
        return this.feeTypesService.findAll(active);
    }
    findOne(id) {
        return this.feeTypesService.findOne(id);
    }
    create(createFeeTypeDto) {
        return this.feeTypesService.create(createFeeTypeDto);
    }
    update(id, updateFeeTypeDto) {
        return this.feeTypesService.update(id, updateFeeTypeDto);
    }
    delete(id) {
        return this.feeTypesService.delete(id);
    }
};
exports.FeeTypesController = FeeTypesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('activeOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FeeTypesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], FeeTypesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fee_type_dto_1.CreateFeeTypeDto]),
    __metadata("design:returntype", void 0)
], FeeTypesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, fee_type_dto_1.UpdateFeeTypeDto]),
    __metadata("design:returntype", void 0)
], FeeTypesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], FeeTypesController.prototype, "delete", null);
exports.FeeTypesController = FeeTypesController = __decorate([
    (0, common_1.Controller)('fee-types'),
    __metadata("design:paramtypes", [fee_types_service_1.FeeTypesService])
], FeeTypesController);
//# sourceMappingURL=fee-types.controller.js.map