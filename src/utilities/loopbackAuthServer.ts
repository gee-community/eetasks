/* eslint-disable @typescript-eslint/naming-convention */
/*
Loopback oauth2 flow. See:
https://developers.google.com/identity/protocols/oauth2/native-app#redirect-uri_loopback

To be used to serve the static files in media/
and listen to the authorization code sent by google

Based on the github-authentication extension* 
https://github.com/microsoft/vscode/blob/main/extensions/github-authentication/src/node/authServer.ts

* Copyright (c) Microsoft Corporation, see:
https://github.com/microsoft/vscode/blob/main/LICENSE.txt

*/
import * as http from 'http';
import { URL } from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

function sendFile(res: http.ServerResponse, filepath: string) {
	fs.readFile(filepath, (err, body) => {
		if (err) {
			console.error(err);
			res.writeHead(404);
			res.end();
		} else {
			res.writeHead(200, {
				'content-length': body.length,
			});
			res.end(body);
		}
	});
}

interface IOAuthResult {
	code: string;
	state: string;
}

interface ILoopbackServer {
	/**
	 * If undefined, the server is not started yet.
	 */
	port: number | undefined;

	/**
	 * The nonce used
	 */
	nonce: string;

	/**
	 * The state parameter used in the OAuth flow.
	 */
	state: string | undefined;

	/**
	 * Starts the server.
	 * @returns The port to listen on.
	 * @throws If the server fails to start.
	 * @throws If the server is already started.
	 */
	start(): Promise<number>;
	/**
	 * Stops the server.
	 * @throws If the server is not started.
	 * @throws If the server fails to stop.
	 */
	stop(): Promise<void>;
	/**
	 * Returns a promise that resolves to the result of the OAuth flow.
	 */
	waitForOAuthResponse(): Promise<IOAuthResult>;
}

export class LoopbackAuthServer implements ILoopbackServer {
	private readonly _server: http.Server;
	private readonly _resultPromise: Promise<IOAuthResult>;
	private _startingRedirect: URL;

	public nonce = randomBytes(16).toString('base64');
	public port: number | undefined;

	public set state(state: string | undefined) {
		if (state) {
			this._startingRedirect.searchParams.set('state', state);
		} else {
			this._startingRedirect.searchParams.delete('state');
		}
	}
	public get state(): string | undefined {
		return this._startingRedirect.searchParams.get('state') ?? undefined;
	}

	constructor(serveRoot: string, startingRedirect: string) {
		if (!serveRoot) {
			throw new Error('serveRoot must be defined');
		}
		if (!startingRedirect) {
			throw new Error('startingRedirect must be defined');
		}
		let deferred: { resolve: (result: IOAuthResult) => void; reject: (reason: any) => void };
		this._resultPromise = new Promise<IOAuthResult>((resolve, reject) => deferred = { resolve, reject });
        this._startingRedirect = new URL(startingRedirect.toString());

		this._server = http.createServer((req, res) => {
			const reqUrl = new URL(req.url!, `http://${req.headers.host}`);
			switch (reqUrl.pathname) {
				case '/signin': {
					const receivedNonce = (reqUrl.searchParams.get('nonce') ?? '').replace(/ /g, '+');
					if (receivedNonce !== this.nonce) {
						res.writeHead(302, { location: `/?error=${encodeURIComponent('Nonce does not match.')}` });
						res.end();
					}
                    // Note: the original github authenticator extension
                    // uses an intermediate redirect_uri set to 
                    // vscode.dev/redirect
                    // and it receives a "state" parameter 
                    // that is ultimately used to redirect back to here. 
                    // I have no idea why this is needed.. but here it works
                    // if we simply use the redirect back to us directly:
                    // we are still validating the nonce as well as a "state"
                    // (which contains nonce AND port). 
                    this._startingRedirect.searchParams.set('redirect_uri',
                    `http://localhost:${this.port}/callback?nonce=${this.nonce}`);

					res.writeHead(302, { location: this._startingRedirect.toString() });
					res.end();
					break;
				}
				case '/callback': {
					const code = reqUrl.searchParams.get('code') ?? undefined;
					const state = reqUrl.searchParams.get('state') ?? undefined;
					const nonce = (reqUrl.searchParams.get('nonce') ?? '').replace(/ /g, '+');
                    if (!code){
 						res.writeHead(302, { location: `/?error=${encodeURIComponent('User cancelled the authorization.')}` });
						res.end();
                        deferred.reject('User cancelled the authorization.');
                        break;
                        //throw new Error('User cancelled the authorization.');                       
                    }
					if (!state || !nonce) {
						res.writeHead(302, { location: `/?error=${encodeURIComponent('No state or nonce in response!')}` });
						res.end();
                        deferred.reject('No state or nonce in response!');
                        break;
					}
					if (this.state !== state) {
						res.writeHead(302, { location: `/?error=${encodeURIComponent('State does not match.')}` });
						res.end();
                        deferred.reject('State does not match.');
                        break;
					}
					if (this.nonce !== nonce) {
						res.writeHead(302, { location: `/?error=${encodeURIComponent('Nonce does not match.')}` });
						res.end();
                        deferred.reject('Nonce does not match.');
                        break;
					}
					deferred.resolve({ code , state});
					res.writeHead(302, { location: '/' });
					res.end();
					break;
				}
				// Serve the static files
				case '/':
					sendFile(res, path.join(serveRoot, 'index.html'));
					break;
				default:
					// substring to get rid of leading '/'
					sendFile(res, path.join(serveRoot, reqUrl.pathname.substring(1)));
					break;
			}
		});
	}

	public start(): Promise<number> {
		return new Promise<number>((resolve, reject) => {
			if (this._server.listening) {
				throw new Error('Server is already started');
			}
			const portTimeout = setTimeout(() => {
				reject(new Error('Timeout waiting for port'));
			}, 5000);
			this._server.on('listening', () => {
				const address = this._server.address();
				if (typeof address === 'string') {
					this.port = parseInt(address);
				} else if (address instanceof Object) {
					this.port = address.port;
				} else {
					throw new Error('Unable to determine port');
				}

				clearTimeout(portTimeout);

				// set state
				this.state = `?port=${this.port}?nonce=${encodeURIComponent(this.nonce)}`;
                // originally used to encode the final redirect_uri back to here.. 
                // by using the initial redirect_uri as vscode.dev/redirect.. 
                // here we are still using state for validation (as well as the nonce). 
                //this.state = `http://127.0.0.1:${this.port}/callback?nonce=${encodeURIComponent(this.nonce)}`;

				resolve(this.port);
			});
			this._server.on('error', err => {
				reject(new Error(`Error listening to server: ${err}`));
			});
			this._server.on('close', () => {
				reject(new Error('Closed'));
			});
			this._server.listen(0, '127.0.0.1');
		});
	}

	public stop(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			if (!this._server.listening) {
				throw new Error('Server is not started');
			}
			this._server.close((err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}

	public waitForOAuthResponse(): Promise<IOAuthResult> {
		return this._resultPromise;
	}
}