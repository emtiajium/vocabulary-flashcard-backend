-- users using leitner systems
SELECT DISTINCT U.username, COUNT(DISTINCT "vocabularyId") AS count
FROM "LeitnerSystems"
         INNER JOIN "User" AS U ON "LeitnerSystems"."userId" = U.id
GROUP BY U.username
ORDER BY count DESC;
