# Deprecated & Unused Code Audit

## Overview
This document lists deprecated fields, unused endpoints, and legacy code that may be candidates for cleanup or are kept for backward compatibility.

---

## Deprecated Fields

### 1. Single Payment Mode (fee-collection.dto.ts)

**Location**: [fee-collection.dto.ts:55-58](file:///Users/sumitadm21/Downloads/GitHub-Sumit21adm/School-Management-System/backend/src/fees/dto/fee-collection.dto.ts#L55-L58)

```typescript
// Single payment mode - deprecated but kept for backward compatibility
@IsEnum(PaymentMode)
@IsOptional()
paymentMode?: PaymentMode;
```

**Status**: Deprecated - Kept for backward compatibility

**New Implementation**: Use `paymentModes[]` array for split payment support

```typescript
paymentModes: PaymentModeDetailDto[]  // Array of {paymentMode, amount, reference}
```

---

### 2. Route Monthly Fee (schema.prisma)

**Location**: [schema.prisma:744](file:///Users/sumitadm21/Downloads/GitHub-Sumit21adm/School-Management-System/backend/prisma/schema.prisma#L744)

```prisma
monthlyFee      Decimal?  @db.Decimal(10,2)  // Transport fee for this route (Deprecated)
```

**Status**: Deprecated

**Replacement**: `TransportFareSlab` model for distance-based fare calculation

**Notes**: 
- Old system: Fixed fee per route
- New system: Fare calculated from `RouteStop.distanceFromSchool` → `TransportFareSlab`

---

## TODO Items

### 1. Transport Discount (fees.service.ts)

**Location**: [fees.service.ts:694](file:///Users/sumitadm21/Downloads/GitHub-Sumit21adm/School-Management-System/backend/src/fees/fees.service.ts#L694)

```typescript
// TODO: Implement Transport Discount if needed
const transportDiscount = 0;
```

**Status**: Not implemented

**Notes**: Currently hardcoded to 0. May need implementation if transport discounts become a requirement.

---

## Analysis Summary

| Type | Count | Action |
|------|-------|--------|
| Deprecated Fields | 2 | Keep for compatibility, mark in docs |
| TODO Items | 1 | Implement when required |
| Unused Endpoints | 0 | None found |
| Dead Code | 0 | None found |

---

## Recommendations

1. **Payment Mode Field**: Keep deprecated field for 2-3 versions, then remove in major version update
2. **Route.monthlyFee**: Can be removed once all routes use distance-based pricing
3. **Transport Discount**: Implement if feature request comes in

---

*Last Updated: January 17, 2026*
