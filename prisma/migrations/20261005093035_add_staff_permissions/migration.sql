-- AlterTable
ALTER TABLE "User" ADD COLUMN "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Existing accounts keep the access their role already had.
UPDATE "User"
SET "permissions" = ARRAY[
  'patients:view',
  'patients:register',
  'visits:opd',
  'visits:admit',
  'visits:note',
  'visits:discharge',
  'visits:charge',
  'beds:view',
  'beds:manage',
  'inventory:view',
  'inventory:manage',
  'expenses:view',
  'expenses:create',
  'reports:fees',
  'reports:charges',
  'reports:expenses',
  'staff:manage',
  'doctors:manage'
]::TEXT[]
WHERE "role" = 'ADMIN';

UPDATE "User"
SET "permissions" = ARRAY[
  'patients:view',
  'patients:register',
  'visits:opd',
  'beds:view',
  'reports:fees',
  'doctors:manage'
]::TEXT[]
WHERE "role" = 'RECEPTIONIST';

UPDATE "User"
SET "permissions" = ARRAY[
  'patients:view',
  'visits:note',
  'visits:discharge',
  'beds:view'
]::TEXT[]
WHERE "role" = 'DOCTOR';

UPDATE "User"
SET "permissions" = ARRAY[
  'patients:view',
  'patients:register',
  'visits:admit',
  'visits:note',
  'visits:discharge',
  'visits:charge',
  'beds:view',
  'beds:manage',
  'inventory:view',
  'reports:charges'
]::TEXT[]
WHERE "role" = 'NURSE';

UPDATE "User"
SET "permissions" = ARRAY[
  'patients:view',
  'beds:view',
  'inventory:view',
  'inventory:manage',
  'expenses:view',
  'expenses:create'
]::TEXT[]
WHERE "role" = 'ASSISTANT';
