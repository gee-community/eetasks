/* eslint-disable @typescript-eslint/naming-convention */
import { ExtensionContext, SecretStorage } from 'vscode';
import { IPickedAccount, getEECredentials } from './accountPicker';
import { GEE_AUTH_ID, GEE_AUTH_SECRET } from './authenticate';
import https = require('https');
/*
Handles retrieving a token for an account, either
from the state, or by generating a new one.
If generating a new one, it also updates the token in the
extension state for later reuse. 
Returns a Promise that resolves to the token (string) 
or rejects with an error. 
*/
export async function getAccountToken(account:IPickedAccount, extensionState:any, context: ExtensionContext){
   return new Promise((resolve, reject) => {
        validateToken(checkStateForExistingToken(account.name, extensionState))
        .then(async (tokenInfo:any)=>{
            if((! tokenInfo)){
                console.log("Generating a new token for " + account.name);
                try{
                const token:any = await newToken(account, context);
                if(token){
                 saveToken(token, account.name, extensionState);   
                }
                resolve(token);
                }catch(err){
                  reject("Error generating a new token. \n" + err);
                }
            }else{
            console.log("Reusing valid token for " + account.name); 
            resolve(tokenInfo.token);
            }
        }
        ).catch((err:any)=>reject(err));
   });
}


/*
Looks for an account token in the extension state
Returns null if not found. 
account must already exist in userAccounts
userAccounts is a dictionary with accountName:token pairs
*/
function checkStateForExistingToken(account:string, extensionState:any){
    let token = null;
    let accounts = extensionState.get("userAccounts"); 
    if(accounts){
        if (account in accounts){
            token = accounts[account].token;
        }
    }
    return token;
}


/*
Sends a GET request to https://oauth2.googleapis.com
to validate the token
Returns a Promise that resolves to:
{"expires_in", "access_type", "token", ...} for a valid token, 
or null if the token is invalid or there is an error
*/
export function validateToken(token:string|null){
 const oauthHost="oauth2.googleapis.com";
  return new Promise((resolve) => {
    if (! token){resolve(null);}
    let req = https.request(
      {
        host: oauthHost,
        path: `/tokeninfo?access_token=${token}`,
        method: 'GET',
      },
      function(res:any) {
        let buffers: any[] | Uint8Array[] = [];
        res.on('error', (e:any)=>
            {
            console.log(e);
            resolve(null);
            }
            );
        res.on('data', (buffer: any) => buffers.push(buffer));
        res.on(
          'end',
          () =>{ 
            let out = JSON.parse(Buffer.concat(buffers).toString());
            out.token = token;
            if ("error" in out){
                resolve(null);
            }else{
            resolve(out);
            }
          }
        );
      }
    );
    req.end();
  });
}

    
/*
  Retrieves a new token either from persistent credentials
  or using gcloud. Returns a promise that resolves to
  the JSON result (which includes the token),
  or rejects with a JSON result including the error description.
*/   
function newToken(account:IPickedAccount, context: ExtensionContext){
    switch(account.kind){
        case "Signed in":
            return getTokenFromSignedInAccount(account.name, context); 
        case "python earthengine-api credentials":
            return getTokenFromPersistentCredentials();
        case "gcloud":
            return gcloud(account.name);
    }
}


/*
Reads persistent credentials and gets a new token
using the credentials.
Returns a Promise that resolves to the token *string) 
or rejects with the error.
*/
function getTokenFromPersistentCredentials(){
    return new Promise((resolve, reject)=>{
    getEECredentials()
    .then((credentials:any)=>{
        if(!credentials){reject("EE credentials not found.");}
        getTokenFromCredentials(credentials)
        .then((tokenInfo:any)=>{
            resolve(tokenInfo.access_token);
        }
        ).catch((err:any)=>reject(err));
    }).catch((err:any)=>reject(err));
    });
}

/*
Reads the secret store for the given account, 
prepares the credentials and calls getTokenFromCredentials
Returns a Promise that resolves to the token 
or rejects with the error.
*/
function getTokenFromSignedInAccount(account:string, context:ExtensionContext){
    return new Promise((resolve, reject)=>{
        const secrets: SecretStorage = context.secrets;
        secrets.get(account).then((refreshToken)=>{
        if(refreshToken){
        getTokenFromCredentials({
            client_id: GEE_AUTH_ID,
            client_secret: GEE_AUTH_SECRET,
            grant_type: "refresh_token",
            refresh_token: refreshToken
        })
        .then((tokenInfo:any)=>{
            resolve(tokenInfo.access_token);
        }).catch((err:any)=>reject(err));
        }
        });        
    });
}


/*
Sends a POST request to https://oauth2.googleapis.com/token
with the given credentials
Returns a Promise that resolves to the given Token:
{"access_token", "expires_in", etc..}
or rejects the promise with the error. 
*/
export function getTokenFromCredentials(credentials:any) {
/* eslint-disable @typescript-eslint/naming-convention */
 const oauthHost="oauth2.googleapis.com";
 let dataEncoded = JSON.stringify(credentials);
  return new Promise((resolve, reject) => {
    let req = https.request(
      {
        host: oauthHost,
        path: "/token",
        method: 'POST',
        headers: {
          'Content-Length': Buffer.byteLength(dataEncoded),
          'Content-Type': 'application/json',
        },
      },
      function(res:any) {
        let buffers: any[] | Uint8Array[] = [];
        res.on('error', reject);
        res.on('data', (buffer: any) => buffers.push(buffer));
        res.on(
          'end',
          () => 
            res.statusCode === 200
              ? resolve(JSON.parse(
                Buffer.concat(buffers).toString()
                ))
              : reject(Buffer.concat(buffers))
        );
      }
    );
    req.write(dataEncoded);
    req.end();
  });
}
    
/*
Calls gcloud using child_process.exec
Returns a Promise that resolves
to the token (str), or rejects
with the error.    
🔲 TODO: use a vscode function instead of exec.
*/
function gcloud(account:string){   
   const { exec } = require('child_process');
   let gcommand = "gcloud auth print-access-token " + account;
    if (account==="application-default"){
       gcommand = "gcloud auth application-default print-access-token";
   }
   return new Promise((resolve, reject) => {
    exec(gcommand, (err:any, stdout:any, stderr:any) => {
      if (err) {reject(stderr);}
      resolve(stdout.trim());
    });
    });
}


/*
Handles saving an account token to the extention state.
*/
export function saveToken(token:string, account:string, extensionState:any){
    let accounts = extensionState.get("userAccounts"); 
    if(accounts){
        if (account in accounts){
            accounts[account].token = token;
            extensionState.update("userAccounts", accounts);
        }
    }
    return;
}

