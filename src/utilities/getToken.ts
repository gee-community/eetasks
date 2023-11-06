import https = require('https');
/*
Handles retrieving a token for an account, either
from the state, or by generating a new one.
If generating a new one, it also updates the token in the
extension state for later reuse. 
Returns a Promise that resolves to the token (string) 
or rejects with an error. 
*/
export function getAccountToken(account:string, extensionState:any){
   return new Promise((resolve, reject) => {
        validateToken(checkStateForExistingToken(account, extensionState))
        .then((tokenInfo:any)=>{
            if("error" in tokenInfo){
                console.log("Generating a new token for " + account);
                newToken(account)
                .then((tok:any)=>{
                saveToken(tok, account, extensionState);
                resolve(tok);
                });
            }else{
            console.log("Reusing valid token for " + account); 
            resolve(tokenInfo.token);
            }
        }
        ).catch((err:any)=>reject(err));
   });
}


/*
Looks for an account token in the extension state
Returns an empty string "" if not found. 
*/
function checkStateForExistingToken(account:string, extensionState:any){
    let token = ""; 
    let tokens = extensionState.get("tokens"); 
    if(tokens){
        if (account in tokens){token = tokens[account];}
    }
    return token;
}


/*
Sends a GET request to https://oauth2.googleapis.com
to validate the token
Returns a Promise that resolves to:
{"expires_in", "access_type", "token", ...} for a valid token, 
{"error":"invalid_token", "error_description":..., "token": ...} for an invalid token,
or rejects the Promise with an error. 
*/
function validateToken(token:string){
 const oauthHost="oauth2.googleapis.com";
  return new Promise((resolve, reject) => {
    if (token.length===0){reject;}
    let req = https.request(
      {
        host: oauthHost,
        path: `/tokeninfo?access_token=${token}`,
        method: 'GET',
      },
      function(res:any) {
        let buffers: any[] | Uint8Array[] = [];
        res.on('error', reject);
        res.on('data', (buffer: any) => buffers.push(buffer));
        res.on(
          'end',
          () =>{ 
            let out = JSON.parse(Buffer.concat(buffers).toString());
            out.token = token;
            resolve(out);
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
function newToken(account:string){
    return account === "earthengine" 
    ? getTokenFromPersistentCredentials() : gcloud(account);
  }


/*
Reads persistent credentials and gets a new token
using the credentials.
Returns a Promise with the token (string) or
rejects with the error.
*/
function getTokenFromPersistentCredentials(){
    return new Promise((resolve, reject)=>{
    readPersistentCredentials()
    .then((credentials:any)=>{
        getTokenFromCredentials(credentials)
        .then((tokenInfo:any)=>{
            resolve(tokenInfo.access_token);
        }
        ).catch((err:any)=>reject(err));
    }).catch((err:any)=>reject(err));
    });
}


/*
Reads the ~/.config/earthengine/credentials file*
asynchronously. Returns a Promise that resolves
to the JSON content of the file, or rejects
with the error. 
*This file is stored and managed by the python 
earthengine API. This extension will not modify it. 
*/
function readPersistentCredentials(){
    const os = require("os");
    const path = require("path");
    const fs = require("fs");
    const homedir = os.homedir();
    const credentialsFile = path.join(homedir, 
        ".config", "earthengine", "credentials"
    );
    return new Promise((resolve, reject) => {
        fs.readFile(credentialsFile,"utf8", 
        (err:any, data:any) => {
          if (err) {reject(err);};
          let credentials=JSON.parse(data.toString());
          credentials.grant_type="refresh_token";
          resolve(credentials);
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
function getTokenFromCredentials(credentials:any) {
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
function saveToken(token:string, account:string, extensionState:any){

    let tokens = extensionState.get("tokens");
    if(!tokens){tokens = {}; }
    tokens[account] = token;
    extensionState.update("tokens", tokens); 
}

