import { OAuth2Client } from 'google-auth-library';
import { decode } from 'jsonwebtoken';

async function decodeToken(token: string): Promise<void> {
    console.dir(decode(token), { depth: null, colors: true });

    const oAuth2ClientId = process.env.GOOGLE_AUTH_CLIENT_ID;
    const oAuth2Client = new OAuth2Client(oAuth2ClientId);
    const loginTicket = await oAuth2Client.verifyIdToken({
        idToken: token,
        audience: oAuth2ClientId,
    });
    const payload = loginTicket.getPayload();
    console.dir(payload, { depth: null, colors: true });
}

console.log(process.argv);
decodeToken(process.argv[2]).catch(console.error);

// node -r dotenv/config practice/scripts/token-manager.ts TOKEN_GOES_HERE
