# RestoFlow ERP — Product Scope Definition v1.0

> **Document Version:** 1.0  
> **Effective Date:** 2026-02-19  
> **Owner:** Product Team  
> **Status:** Active  

---

## 1. Release Version Scope (v1.0)

### Product Name
**RestoFlow ERP** — Enterprise Restaurant Management Platform

### Version
**v1.0.0** — Initial Production Release

### Description
RestoFlow ERP is a full-stack, cloud-ready restaurant enterprise resource planning system designed for the Middle East market (Egypt-first). It covers the full operational cycle of restaurant businesses: point of sale, kitchen operations, inventory, finance, HR, CRM, delivery, and compliance.

### Core Value Proposition
- **All-in-one**: POS + KDS + Inventory + Finance + HR + CRM + Delivery in a single platform
- **Arabic-first**: Native RTL, Arabic UI, Egyptian tax compliance (ETA)
- **Real-time**: Socket.IO powered real-time sync across all stations
- **Offline-capable**: Dexie-based offline-first POS with conflict resolution
- **Multi-branch**: Centralized management of unlimited branches

---

## 2. Target Market

### Primary Market
| Segment | Description | Branch Count |
|---------|------------|-------------|
| **SME Restaurants** | Single-branch or 2-5 branches, fast casual / casual dining | 1-5 |
| **Restaurant Chains** | Multi-branch operations with centralized management | 5-50 |

### Secondary Market (v2.0+)
| Segment | Description |
|---------|------------|
| **Franchise Operations** | Franchise model with royalty tracking |
| **Cloud Kitchens** | Delivery-only operations |
| **Food Courts** | Multi-tenant food court management |

### Geographic Focus
- **v1.0**: Egypt (Cairo, Giza, Alexandria, Delta)
- **v1.5**: GCC (Saudi Arabia, UAE)
- **v2.0**: MENA region

---

## 3. Core Use Cases (v1.0)

### 3.1 Point of Sale (POS)
| ID | Use Case | Priority |
|----|----------|----------|
| POS-01 | Place dine-in order with table assignment | P0 |
| POS-02 | Place takeaway / delivery / pickup order | P0 |
| POS-03 | Apply modifiers (size, extras) to items | P0 |
| POS-04 | Process payment (Cash, Visa, VodafoneCash, InstaPay) | P0 |
| POS-05 | Split bill between guests | P0 |
| POS-06 | Apply discount (with manager approval) | P0 |
| POS-07 | Void order item (with audit) | P0 |
| POS-08 | Process refund | P0 |
| POS-09 | Open/close shift with cash reconciliation | P0 |
| POS-10 | Print receipt to cashier/kitchen printers | P0 |
| POS-11 | Work offline and sync on reconnect | P0 |

### 3.2 Kitchen Display System (KDS)
| ID | Use Case | Priority |
|----|----------|----------|
| KDS-01 | Display incoming order tickets | P0 |
| KDS-02 | Update ticket status (Preparing → Ready) | P0 |
| KDS-03 | Alert on delayed tickets | P0 |
| KDS-04 | Show station load & bottleneck | P1 |

### 3.3 Menu Management
| ID | Use Case | Priority |
|----|----------|----------|
| MENU-01 | Create categories and items with images | P0 |
| MENU-02 | Configure modifier groups | P0 |
| MENU-03 | Set availability schedules | P1 |
| MENU-04 | Support multiple price lists per branch | P1 |
| MENU-05 | Link items to kitchen printers | P0 |

### 3.4 Inventory & Supply Chain
| ID | Use Case | Priority |
|----|----------|----------|
| INV-01 | Track stock levels across warehouses | P0 |
| INV-02 | Transfer stock between warehouses | P0 |
| INV-03 | Receive goods from purchase orders | P0 |
| INV-04 | Record wastage | P0 |
| INV-05 | Auto-deduct stock on order completion | P1 |
| INV-06 | Recipe costing | P0 |
| INV-07 | Production orders for composite items | P1 |

### 3.5 Finance & Accounting
| ID | Use Case | Priority |
|----|----------|----------|
| FIN-01 | Chart of accounts with double-entry | P0 |
| FIN-02 | Auto-post sales journal entries | P0 |
| FIN-03 | Trial balance | P0 |
| FIN-04 | P&L report | P0 |
| FIN-05 | Balance sheet | P0 |
| FIN-06 | Day close with reconciliation | P0 |
| FIN-07 | VAT report (Egypt 14%) | P0 |
| FIN-08 | Period closing | P1 |

### 3.6 Human Resources
| ID | Use Case | Priority |
|----|----------|----------|
| HR-01 | Employee records with roles | P0 |
| HR-02 | Clock-in / clock-out attendance | P0 |
| HR-03 | Payroll calculation | P0 |
| HR-04 | Leave management | P1 |

### 3.7 CRM & Loyalty
| ID | Use Case | Priority |
|----|----------|----------|
| CRM-01 | Customer database with segmentation | P0 |
| CRM-02 | Loyalty points with tier auto-promotion | P0 |
| CRM-03 | Marketing campaigns (SMS/WhatsApp) | P1 |

### 3.8 Delivery & Dispatch
| ID | Use Case | Priority |
|----|----------|----------|
| DEL-01 | Driver assignment and status tracking | P0 |
| DEL-02 | SLA monitoring and escalation | P0 |
| DEL-03 | Delivery zone management | P0 |

### 3.9 Call Center
| ID | Use Case | Priority |
|----|----------|----------|
| CC-01 | Take orders on behalf of customers | P0 |
| CC-02 | Escalation management | P0 |
| CC-03 | Supervisor monitoring dashboard | P1 |

### 3.10 Reports
| ID | Use Case | Priority |
|----|----------|----------|
| RPT-01 | Daily sales report | P0 |
| RPT-02 | Profit summary and daily breakdown | P0 |
| RPT-03 | Food cost analysis | P0 |
| RPT-04 | Dashboard KPIs | P0 |
| RPT-05 | Export (CSV, PDF) | P0 |
| RPT-06 | VAT / fiscal report | P0 |

### 3.11 Security & Compliance
| ID | Use Case | Priority |
|----|----------|----------|
| SEC-01 | RBAC with custom permissions | P0 |
| SEC-02 | MFA for admin/finance roles | P0 |
| SEC-03 | Full audit trail with tamper detection | P0 |
| SEC-04 | ETA e-receipt submission (Egypt fiscal) | P0 |
| SEC-05 | Session management and revocation | P0 |

---

## 4. Out-of-Scope (v1.0)

The following features are explicitly **not included** in v1.0 and are planned for future releases:

| Feature | Target Version | Reason |
|---------|---------------|--------|
| Mobile customer app (iOS/Android) | v2.0 | Requires separate project |
| Online ordering web app | v1.5 | Depends on payment gateway |
| Franchise royalty management | v2.0 | Enterprise-tier feature |
| Multi-currency support | v1.5 | Requires exchange rate service |
| Third-party delivery integration (Talabat) | v1.5 | Requires API partnership |
| Driver mobile app | v1.5 | Separate PWA project |
| BI dashboard builder | v2.0 | Advanced analytics feature |
| VoIP/SIP call center integration | v2.0 | Requires telephony partner |
| Barcode scanner hardware integration | v1.1 | Quick follow-up |
| Weight scale integration | v1.1 | Quick follow-up |
| Customer display screen | v1.1 | Quick follow-up |
| GDPR full compliance | v1.5 | Legal review needed |
| Fixed assets & depreciation | v2.0 | Enterprise accounting |
| Multi-tenancy (SaaS) | v3.0 | Architecture change |

---

## 5. Service Level Agreement (SLA)

### 5.1 Availability
| Tier | Uptime Target | Downtime/Month |
|------|--------------|----------------|
| Standard | 99.5% | ~3.6 hours |
| Premium | 99.9% | ~43 minutes |

### 5.2 Response Times
| Metric | Target |
|--------|--------|
| API response (p95) | < 500ms |
| POS order submission | < 1s |
| KDS ticket display | < 2s from order |
| Report generation | < 10s |
| Page load (initial) | < 3s |

### 5.3 Support
| Channel | Standard | Premium |
|---------|----------|---------|
| Email | 24h response | 4h response |
| WhatsApp | Business hours | 24/7 |
| Phone | N/A | 24/7 (critical) |
| On-site | N/A | Available |

### 5.4 Data
| Policy | Value |
|--------|-------|
| Backup frequency | Daily automated |
| Backup retention | 30 days |
| RTO (Recovery Time) | < 4 hours |
| RPO (Recovery Point) | < 24 hours |
| Data ownership | 100% customer-owned |

---

## 6. Release Strategy

### Version Numbering
`MAJOR.MINOR.PATCH` (Semantic Versioning)

### Release Cadence
| Release Type | Frequency | Description |
|-------------|-----------|-------------|
| **Patch** (x.x.X) | As needed | Bug fixes, security patches |
| **Minor** (x.X.0) | Monthly | New features, improvements |
| **Major** (X.0.0) | Quarterly | Breaking changes, major features |

### Release Workflow
1. **Development** → Feature branch
2. **Review** → Pull request + code review
3. **Staging** → Deploy to staging environment
4. **QA** → Automated tests + manual validation
5. **UAT** → Customer acceptance testing
6. **Production** → Blue-green deployment
7. **Monitor** → 24h observation period

### Rollback Policy
- Every production deployment must have an automated rollback procedure
- Database migrations must be reversible
- Previous version Docker image is retained for 30 days
- Rollback decision authority: CTO or Lead Engineer
- Maximum rollback time: 15 minutes

---

## 7. Success Metrics (v1.0)

| KPI | Target | Measurement |
|-----|--------|-------------|
| System uptime | > 99.5% | Monitoring dashboard |
| Order processing success | > 99.9% | Error rate tracking |
| ETA submission success | > 95% | Fiscal logs |
| Average POS response | < 500ms | APM |
| Customer onboarding time | < 2 days | Support tickets |
| Critical bug resolution | < 4 hours | Issue tracker |
| Client retention (3 months) | > 90% | CRM |

---

*Document approved by: [Pending]*  
*Next review date: 2026-03-19*
