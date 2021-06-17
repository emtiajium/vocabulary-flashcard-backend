SET SESSION my.firstUsername = 'example404@gibberish.com';
SET SESSION my.secondUsername = 'example405@gibberish.com';
SET SESSION my.cohortName = 'Game Theory Study Group';

INSERT
INTO "User" (id, "createdAt", "updatedAt", version, username, firstname)
VALUES (DEFAULT, DEFAULT, DEFAULT, 1, current_setting('my.firstUsername')::VARCHAR, 'Alice'),
       (DEFAULT, DEFAULT, DEFAULT, 1, current_setting('my.secondUsername')::VARCHAR, 'Bob')
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
WHERE username = current_setting('my.firstUsername')::VARCHAR;

UPDATE "User"
SET "cohortId" = (SELECT id FROM "Cohort" WHERE name = current_setting('my.cohortName')::VARCHAR)
WHERE username = current_setting('my.secondUsername')::VARCHAR;

SELECT *
FROM "Cohort"
WHERE name = current_setting('my.cohortName')::VARCHAR;

SELECT *
FROM "User"
WHERE "cohortId" = (
    SELECT id
    FROM "Cohort"
    WHERE name = current_setting('my.cohortName')::VARCHAR
);
