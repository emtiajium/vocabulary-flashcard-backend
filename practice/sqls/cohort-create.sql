SET SESSION my.username = 'example404@gibberish.com';
SET SESSION my.cohortName = 'The Best Cohort Ever Exist';

INSERT INTO "User" (id, "createdAt", "updatedAt", version, username, firstname, lastname)
VALUES (DEFAULT, DEFAULT, DEFAULT, 1, current_setting('my.username')::VARCHAR, 'John', 'Doe')
ON CONFLICT ("username") DO NOTHING;

CREATE OR REPLACE FUNCTION "getUserId"(requestedUsername VARCHAR)
    RETURNS UUID AS
$$
SELECT id
FROM "User"
WHERE "User".username = requestedUsername
$$
    LANGUAGE SQL;

INSERT INTO "Cohort"("id", "createdAt", "updatedAt", "version", "name")
VALUES (DEFAULT, DEFAULT, DEFAULT, 1, current_setting('my.cohortName')::VARCHAR)
ON CONFLICT ("name") DO NOTHING;

UPDATE "User"
SET "cohortId" = (SELECT id FROM "Cohort" WHERE name = current_setting('my.cohortName')::VARCHAR)
WHERE username = current_setting('my.username')::VARCHAR;

SELECT *
FROM "Cohort"
WHERE name = current_setting('my.cohortName')::VARCHAR;

SELECT *
FROM "User"
WHERE username = current_setting('my.username')::VARCHAR;
