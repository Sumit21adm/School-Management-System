"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeStructureModule = void 0;
const common_1 = require("@nestjs/common");
const fee_structure_controller_1 = require("./fee-structure.controller");
const fee_structure_service_1 = require("./fee-structure.service");
const prisma_service_1 = require("../prisma.service");
let FeeStructureModule = class FeeStructureModule {
};
exports.FeeStructureModule = FeeStructureModule;
exports.FeeStructureModule = FeeStructureModule = __decorate([
    (0, common_1.Module)({
        controllers: [fee_structure_controller_1.FeeStructureController],
        providers: [fee_structure_service_1.FeeStructureService, prisma_service_1.PrismaService],
        exports: [fee_structure_service_1.FeeStructureService],
    })
], FeeStructureModule);
//# sourceMappingURL=fee-structure.module.js.map