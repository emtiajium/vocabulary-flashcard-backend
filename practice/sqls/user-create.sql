INSERT INTO "User"("id", "createdAt", "updatedAt", "version", "username", "firstname", "lastname", "profilePictureUrl")
VALUES (DEFAULT, DEFAULT, DEFAULT, 1, 'example55@gibberish.com', 'f', 'l', 'p')
ON CONFLICT ("username") DO UPDATE SET firstname           = EXCLUDED.firstname,
                                       lastname            = EXCLUDED.lastname,
                                       "profilePictureUrl" = EXCLUDED."profilePictureUrl",
                                       "updatedAt"         = NOW(),
                                       version             = "User".version + 1
RETURNING "id", "createdAt", "updatedAt", "version";