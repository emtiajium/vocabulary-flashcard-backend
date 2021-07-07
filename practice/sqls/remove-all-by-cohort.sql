SET SESSION my.cohortId = 'd70880ac-9dfe-4727-a024-53f365796d8a';

DELETE
FROM "Definition"
WHERE "vocabularyId" IN (
    SELECT id
    FROM "Vocabulary"
    WHERE "cohortId" = current_setting('my.cohortId')::UUID
);

DELETE
FROM "Vocabulary"
WHERE "cohortId" = current_setting('my.cohortId')::UUID;

DELETE
FROM "User"
WHERE "cohortId" = current_setting('my.cohortId')::UUID;

DELETE
FROM "Cohort"
WHERE id = current_setting('my.cohortId')::UUID;
