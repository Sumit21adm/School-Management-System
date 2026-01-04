"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_service_1 = require("./prisma.service");
const auth_module_1 = require("./auth/auth.module");
const admissions_module_1 = require("./admissions/admissions.module");
const fees_module_1 = require("./fees/fees.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const sessions_module_1 = require("./sessions/sessions.module");
const fee_types_module_1 = require("./fee-types/fee-types.module");
const fee_structure_module_1 = require("./fee-structure/fee-structure.module");
const discounts_module_1 = require("./discounts/discounts.module");
const promotions_module_1 = require("./promotions/promotions.module");
const print_settings_module_1 = require("./print-settings/print-settings.module");
const examination_module_1 = require("./examination/examination.module");
const users_module_1 = require("./users/users.module");
const classes_module_1 = require("./modules/classes/classes.module");
const subjects_module_1 = require("./subjects/subjects.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            auth_module_1.AuthModule,
            admissions_module_1.AdmissionsModule,
            fees_module_1.FeesModule,
            classes_module_1.ClassesModule,
            dashboard_module_1.DashboardModule,
            sessions_module_1.SessionsModule,
            fee_types_module_1.FeeTypesModule,
            fee_structure_module_1.FeeStructureModule,
            discounts_module_1.DiscountsModule,
            promotions_module_1.PromotionsModule,
            print_settings_module_1.PrintSettingsModule,
            examination_module_1.ExaminationModule,
            users_module_1.UsersModule,
            subjects_module_1.SubjectsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService, prisma_service_1.PrismaService],
        exports: [prisma_service_1.PrismaService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map