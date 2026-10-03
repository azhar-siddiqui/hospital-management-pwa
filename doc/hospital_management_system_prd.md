# Product Requirements Document (PRD)

**Hospital Management Web Application (PWA)**

## 1. Product Overview

A responsive, offline-capable Progressive Web Application (PWA) designed to streamline daily hospital operations. The system handles outpatient (OPD) and inpatient (IPD) workflows, bed management, billing, and basic inventory. Built with a modern Next.js and React stack, it ensures fast performance across mobile, tablet, and desktop devices for all hospital staff.

## 2. User Roles & Access Control

The system utilizes strict Role-Based Access Control (RBAC) to ensure data privacy and operational security across the facility.

- **SUPER_ADMIN (System-wide Control)**
  - **Capabilities:** Multi-branch/tenant oversight, IT system management, and global application settings.
  - **Actions:** Create/suspend ADMIN accounts, view system-wide audit logs, manage database backups, and configure core variables.
- **ADMIN (Hospital-Level Control)**
  - **Capabilities:** Full operational control over a single hospital instance.
  - **Actions:** Manage staff accounts (Receptionists, Doctors, Nurses), view financial dashboards, approve major inventory purchases, and access expense reports.
- **RECEPTIONIST (Front-Desk Operations)**
  - **Capabilities:** Patient onboarding and initial billing.
  - **Actions:** Patient registration, OPD fee collection, receipt generation, and logging referring doctors.
- **DOCTOR (Patient Care)**
  - **Capabilities:** Clinical consultation and oversight.
  - **Actions:** View assigned OPD/IPD patients, add consultation notes, and authorize patient discharges.
- **NURSE (Ward Management)**
  - **Capabilities:** Patient monitoring and ongoing care logging.
  - **Actions:** IPD check-in/out, bed allocation, logging daily service charges (ECG, Oxygen), and updating treatment statuses.

## 3. Core Modules & Features

### 3.1. OPD Management (Outpatient Department)

- **Fast Registration:** Quick data entry forms for new patients capturing critical demographics (Name, Phone, Age, Gender).
- **Visit Logging:** Seamlessly associate existing or new patients with an active OPD visit record.
- **Fee Collection:** Log standard consultation fees and generate basic printable receipts for patients.
- **Referral Tracking:** Record referring doctor names to facilitate accurate commission and referral fee calculations.

### 3.2. IPD & Bed Management (Inpatient Department)

Comprehensive workflow to transition a patient from admitted to discharged status, including real-time visual mapping of hospital assets.

- **Ward Mapping & Bed Categories:** Visual grid management of hospital wards. Supported categories include:
  - **Day Care Ward:** For short-term observation and minor procedures.
  - **General Ward:** Standard inpatient accommodation.
  - **Semi-ICU / Deluxe Ward:** Step-down units and premium rooms.
  - **ICU Ward:** Intensive care unit tracking.
- **Bed Allocation & Constraints:** Real-time tracking of bed statuses (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`). The system enforces a strict 1-to-1 constraint where a bed can only be assigned to one active visit at any given time.

### 3.3. Billing & Service Charges

- **Service Logging:** Ability for Nurses/Staff to append daily charges directly to a patient's active visit record.
- **Standardized Procedures:** Quick-add interfaces for common charges such as ECGs, Oxygen (per hour), and standard procedural fees.
- **Automated Calculation:** System automatically calculates total quantities and aggregates unit prices for final discharge billing statements.

### 3.4. Inventory & Daily Expenses

- **Simplified Stock Overview:** Track physical quantities of essential categories including Medicines, Equipment, and Supplies.
- **Expense Logging:** Dedicated forms to record routine operational costs and cash outflows. All entries are automatically tagged to the authenticated user who logged them.

## 4. Technical Specifications

| Component            | Technology / Strategy                                              |
| :------------------- | :----------------------------------------------------------------- |
| **Frontend & API**   | Next.js (React Server Components and Server Actions)               |
| **Language**         | TypeScript (End-to-end type safety)                                |
| **Database Engine**  | PostgreSQL                                                         |
| **ORM Layer**        | Prisma Client                                                      |
| **UI & Styling**     | Tailwind CSS + Shadcn UI (Accessible, responsive)                  |
| **PWA Capabilities** | `@ducanh2912/next-pwa` (Manifest, service workers, static caching) |
| **Authentication**   | NextAuth.js / Auth0 (Secure sessions, RBAC routing)                |

## 5. Future Phases & Roadmap

- **Offline-First Data Sync:** Future integration of PGlite or local IndexedDB caching to permit patient registration during network outages, resolving with background sync upon reconnection.
- **Analytics Dashboard:** Integration of charting libraries (e.g., Recharts) to provide Admin and Super Admin roles with financial and operational overviews.
- **Patient Portal:** A secure login area for patients to view their discharge summaries and historical billing.
