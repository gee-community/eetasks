/* eslint-disable @typescript-eslint/naming-convention */
/*
Authentication to Google Earth Engine
using the loopback oauth2 flow:
https://developers.google.com/identity/protocols/oauth2/native-app#redirect-uri_loopback
*/
import * as path from 'path';
import * as vscode from 'vscode';
import { SecretStorage } from "vscode";
import { pickSignedInAccount, IAccount, IAccounts } from "./accountPicker";
import { getTokenFromCredentials, validateToken } from '../utilities/getToken';
import { LoopbackAuthServer } from './loopbackAuthServer';

const TIMED_OUT_ERROR = "Timed out.";
const USER_CANCELLATION_ERROR = "User cancelled.";

export const GEE_AUTH_ID = "517222506229-vsmmajv00ul0bs7p89v5m89qs8eb9359"+
".apps.googleusercontent.com";
export const GEE_AUTH_SECRET = "RUP0RZ6e0pPhDzsqIJ7KlNd1";

const SCOPES = "https://www.googleapis.com/auth/userinfo.email "+
"https://www.googleapis.com/auth/earthengine "+
"https://www.googleapis.com/auth/devstorage.full_control";
const baseUri = vscode.Uri.from({
    scheme: "https", 
    authority: "accounts.google.com",
    path: "/o/oauth2/auth"
});


/*
Shows an accountPicker only for signed-in accounts
Upon picking an account, deletes the account from the 
extension context, as well as the secret refresh token.
*/
export async function signout(context: vscode.ExtensionContext){
    let accountName:string|undefined = await pickSignedInAccount(context);
    if(accountName){
        let userAccounts:IAccounts;
        let accounts:any = context.globalState.get("userAccounts");
        if (accounts){
            userAccounts = accounts;
        }else{
            userAccounts = {};
        }
        delete accounts[accountName];
        context.globalState.update("userAccounts", accounts);
        const secrets: SecretStorage = context.secrets;
        secrets.delete(accountName)
        .then(()=>{
            vscode.window.showInformationMessage(
                `${accountName} is now signed out.`
            );
        });
    }
}

/*
Initiates the oauth flow
if user signs in,  
saves the refresh token as a secret
and adds the user account to the extension state,
replacing the gcloud account of the same name if it exists.
*/
export async function signin(context: vscode.ExtensionContext){
    try{
        const authResponse =  await authorizationCode();    
        const exchangeResponse:any = await exchangeCodeForToken(authResponse);
        if ("access_token" in exchangeResponse){
            const validation:any|null = await validateToken(exchangeResponse.access_token);
            if(validation){
                if("email" in validation){
                    const accountName = validation.email;
                    const token = validation.token;
                    const refreshToken = exchangeResponse.refresh_token;
                    let extensionState = context.globalState;
                    const account:IAccount = {
                        kind: "Signed in",
                        token: token
                    };
                    let userAccounts:IAccounts;
                    let accounts:any = extensionState.get("userAccounts");
                    if (accounts){
    // Backwards compatibility
    // In previous versions, userAccounts were simply account(string):token(string)
    // key:value pairs. If we detect this, we need to remove them.
                        let accKeys = Object.keys(accounts);
                        let sampleAccount = accounts[accKeys[0]];
                        if(typeof sampleAccount === "string"){
                            accounts={};
                        }
                        userAccounts = accounts;
                    }else{
                        userAccounts = {};
                    }
                    userAccounts[accountName]=account;
                    extensionState.update("userAccounts", userAccounts);
                    const secrets: SecretStorage = context.secrets;
                    secrets.store(accountName, refreshToken);
                    vscode.window.showInformationMessage(
                        `You are now signed in as ${accountName}`);
                    return accounts;
                }
            }
        }
    }catch(e:any){
        console.log("EE tasks: sign in failed: " + e);
        vscode.window.showErrorMessage(
            "Sign in to accounts.google.com failed: \n " + e);
        return {}; 
    }
}

/*
This is the main flow for getting an authorization code
from accounts.google.com:
- A vscode.window.withProgress shows the user a message
that we are signing in to accounts.google.com, with the 
possibility to cancel the process using a Cancel button.
- A local http server (http://172.0.0.1) will start 
in a port. The server has three paths: /, /signin, and /callback
- Vscode will open (in a browser) the server to the /signin path, 
which will redirect the user to: https://accounts.google.com/o/oauth2/auth
with a redirect_uri looping back to the local server to the
/callback path, also including a random number (nonce) to verify 
the response.
    - If the user signs in to a google account and allows
    the Google Earth Engine Authenticator by clicking the
    Allow button, it will finally loop back to the /callback
    path in the local server.
    - Upon entering the /callback path, the local server
    verifies that the response contains the correct "nonce".
    - If the response is ok, it retrieves the authorization
    code, and finally redirect to the '/' path.
    - The '/' path serves a local static html file 
    found in /media/index.html which displays the message
    "You are signed in now and can close this page."
    - The server stops automatically after 5 minutes, 
    or when the user Cancels the process, or when the
    authorization code is retrieved.
- The function returns a Promise that resolves to
{code: string, port: number}
or rejects with an error. 

Adapted from the github-authentication extension* 
https://github.com/microsoft/vscode/blob/main/extensions/github-authentication

* Copyright (c) Microsoft Corporation, see:
https://github.com/microsoft/vscode/blob/main/LICENSE.txt
*/
interface IAuthResponse{
    code:string,
    port:number,
    nonce:string
}
async function authorizationCode(
): Promise<IAuthResponse> {
	return await vscode.window.withProgress<IAuthResponse>({
		location: vscode.ProgressLocation.Notification,
		title: "Signing in to accounts.google.com",
		cancellable: true
	}, async (_, cancellationToken) => {
		const searchParams = new URLSearchParams([
			['client_id', GEE_AUTH_ID],
               ['response_type', 'code'],
			['scope', SCOPES],
		]);
		const loginUrl = baseUri.with({
			path: '/o/oauth2/auth',
			query: searchParams.toString()
		});
		const server = new LoopbackAuthServer(path.join(__dirname, '../media'), loginUrl.toString(true));
		const port = await server.start();
		let codeToExchange;
		try {
			vscode.env.openExternal(
                   vscode.Uri.parse(
                       `http://127.0.0.1:${port}/signin?nonce=${encodeURIComponent(server.nonce)}`
                       ));
			const { code } = await Promise.race([
                   // Response from server:
				server.waitForOAuthResponse(),
                   // Timeout after 5 min:
				new Promise<any>((_, reject) => 
                       setTimeout(() => reject(TIMED_OUT_ERROR), 
                       300_000)), 
                   // User pressed the cancel button on the notification:
                   new Promise<any>((_, reject)=>
                   cancellationToken.onCancellationRequested(()=>{
                       reject(USER_CANCELLATION_ERROR);
                   })
                   )
			]);
			codeToExchange = code;
		} finally {
            console.log("EE Tasks loopback auth server stopped.");
			setTimeout(() => {
				void server.stop();
			}, 5000);
		}
    return {code: codeToExchange, port: port, nonce: server.nonce};
});
}

/*
Sends a POST request to exchange the authorization code for a token
Returns a Promise that resolves to:
{access_token: string, expires_in: number, refresh_token: string,
scope: string, token_type: 'Bearer'}
or rejects the promise with the error.
See:
https://developers.google.com/identity/protocols/oauth2/native-app#exchange-authorization-code
*/
function exchangeCodeForToken(authResponse: IAuthResponse){
    return getTokenFromCredentials({
        code: authResponse.code,
        redirect_uri: `http://localhost:${authResponse.port}/callback?nonce=${authResponse.nonce}`,
        client_id: GEE_AUTH_ID,
        client_secret: GEE_AUTH_SECRET,
        grant_type: "authorization_code"
    });
}