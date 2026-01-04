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
exports.FeeStatementDto = exports.CollectFeeDto = exports.FeePaymentDetailDto = exports.PaymentMode = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var PaymentMode;
(function (PaymentMode) {
    PaymentMode["CASH"] = "cash";
    PaymentMode["CHEQUE"] = "cheque";
    PaymentMode["ONLINE"] = "online";
    PaymentMode["CARD"] = "card";
    PaymentMode["UPI"] = "upi";
})(PaymentMode || (exports.PaymentMode = PaymentMode = {}));
class FeePaymentDetailDto {
    feeTypeId;
    amount;
    discountAmount;
}
exports.FeePaymentDetailDto = FeePaymentDetailDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], FeePaymentDetailDto.prototype, "feeTypeId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], FeePaymentDetailDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], FeePaymentDetailDto.prototype, "discountAmount", void 0);
class CollectFeeDto {
    studentId;
    sessionId;
    feeDetails;
    paymentMode;
    receiptNo;
    remarks;
    collectedBy;
    date;
    billNo;
}
exports.CollectFeeDto = CollectFeeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CollectFeeDto.prototype, "studentId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CollectFeeDto.prototype, "sessionId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => FeePaymentDetailDto),
    __metadata("design:type", Array)
], CollectFeeDto.prototype, "feeDetails", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(PaymentMode),
    __metadata("design:type", String)
], CollectFeeDto.prototype, "paymentMode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CollectFeeDto.prototype, "receiptNo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CollectFeeDto.prototype, "remarks", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CollectFeeDto.prototype, "collectedBy", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CollectFeeDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CollectFeeDto.prototype, "billNo", void 0);
class FeeStatementDto {
    studentId;
    sessionId;
    fromDate;
    toDate;
}
exports.FeeStatementDto = FeeStatementDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FeeStatementDto.prototype, "studentId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], FeeStatementDto.prototype, "sessionId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FeeStatementDto.prototype, "fromDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FeeStatementDto.prototype, "toDate", void 0);
//# sourceMappingURL=fee-collection.dto.js.map