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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBillStatusDto = exports.GenerateDemandBillDto = exports.BillStatus = void 0;
const class_validator_1 = require("class-validator");
var BillStatus;
(function (BillStatus) {
    BillStatus["PENDING"] = "PENDING";
    BillStatus["SENT"] = "SENT";
    BillStatus["PARTIALLY_PAID"] = "PARTIALLY_PAID";
    BillStatus["PAID"] = "PAID";
    BillStatus["OVERDUE"] = "OVERDUE";
    BillStatus["CANCELLED"] = "CANCELLED";
})(BillStatus || (exports.BillStatus = BillStatus = {}));
class GenerateDemandBillDto {
    studentId;
    className;
    section;
    sessionId;
    month;
    year;
    dueDate;
    studentIds;
    selectedFeeTypeIds;
    autoCalculateLateFees;
}
exports.GenerateDemandBillDto = GenerateDemandBillDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GenerateDemandBillDto.prototype, "studentId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GenerateDemandBillDto.prototype, "className", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GenerateDemandBillDto.prototype, "section", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GenerateDemandBillDto.prototype, "sessionId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], GenerateDemandBillDto.prototype, "month", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GenerateDemandBillDto.prototype, "year", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GenerateDemandBillDto.prototype, "dueDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], GenerateDemandBillDto.prototype, "studentIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNumber)({}, { each: true }),
    __metadata("design:type", Array)
], GenerateDemandBillDto.prototype, "selectedFeeTypeIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GenerateDemandBillDto.prototype, "autoCalculateLateFees", void 0);
class UpdateBillStatusDto {
    status;
    sentDate;
    paidDate;
}
exports.UpdateBillStatusDto = UpdateBillStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(BillStatus),
    __metadata("design:type", String)
], UpdateBillStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateBillStatusDto.prototype, "sentDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateBillStatusDto.prototype, "paidDate", void 0);
//# sourceMappingURL=demand-bill.dto.js.map