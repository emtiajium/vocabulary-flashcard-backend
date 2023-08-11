SET SESSION my.cohortId = '41f89c90-7029-46a4-8211-5f8c6e527a2d';

-- version 1
EXPLAIN ANALYZE VERBOSE
SELECT vocabulary.id,
       vocabulary.word,
       json_agg(json_build_object('id', definition.id, 'meaning', definition.meaning)) AS definitions,
       (COUNT(*) OVER ())::INTEGER                                                     AS "totalNumberOfVocabularies"
FROM "Vocabulary" AS vocabulary
         LEFT JOIN "Definition" AS definition ON vocabulary.id = definition."vocabularyId"
WHERE vocabulary."cohortId" = current_setting('my.cohortId')::UUID
GROUP BY vocabulary.id, vocabulary."word"
ORDER BY vocabulary."word" DESC
OFFSET 10 LIMIT 10;

-- version 2
EXPLAIN ANALYZE VERBOSE
SELECT vocabulary.id, vocabulary.word, vocabulary.definitions, vocabulary."totalNumberOfVocabularies"
FROM (SELECT vocabulary.id,
             vocabulary.word,
             json_agg(json_build_object('id', definition.id, 'meaning', definition.meaning)) AS definitions,
             (COUNT(*) OVER ())::INTEGER                                                     AS "totalNumberOfVocabularies",
             ROW_NUMBER() OVER (ORDER BY vocabulary."word" DESC)                             AS "rowNumber"
      FROM "Vocabulary" AS vocabulary
               LEFT JOIN "Definition" AS definition ON vocabulary.id = definition."vocabularyId"
      WHERE vocabulary."cohortId" = current_setting('my.cohortId')::UUID
      GROUP BY vocabulary.id, vocabulary."word") vocabulary
WHERE vocabulary."rowNumber" BETWEEN 11 AND 20;
