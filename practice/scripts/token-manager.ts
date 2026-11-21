import { OAuth2Client } from 'google-auth-library';
import { decode } from 'jsonwebtoken';
import { compactVerify, createRemoteJWKSet } from 'jose';

async function decodeToken1(token: string): Promise<void> {
    console.dir(decode(token), { depth: null, colors: true });
}

async function decodeToken2(token: string): Promise<void> {
    const googleJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
    const { payload: verifiedBytes } = await compactVerify(token, googleJwks);
    const payload = JSON.parse(Buffer.from(verifiedBytes).toString('utf8'));
    console.dir(payload, { depth: null, colors: true });
}

async function decodeToken3(token: string): Promise<void> {
    const oAuth2ClientId = process.env.GOOGLE_AUTH_CLIENT_ID;
    const oAuth2Client = new OAuth2Client(oAuth2ClientId);
    const loginTicket = await oAuth2Client.verifyIdToken({
        idToken: token,
        audience: oAuth2ClientId,
    });
    const payload = loginTicket.getPayload();
    console.dir(payload, { depth: null, colors: true });
}

decodeToken1(process.argv[2]).catch(console.error);
decodeToken2(process.argv[2]).catch(console.error);
decodeToken3(process.argv[2]).catch(console.error);

// node -r dotenv/config practice/scripts/token-manager.ts TOKEN_GOES_HERE
