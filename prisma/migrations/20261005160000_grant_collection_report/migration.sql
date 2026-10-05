-- Reception and admin can open the monthly collection report.
UPDATE "User"
SET "permissions" = array_append("permissions", 'reports:collection')
WHERE "role" IN ('ADMIN', 'RECEPTIONIST')
  AND NOT ('reports:collection' = ANY("permissions"));
