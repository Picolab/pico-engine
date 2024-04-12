import { krl, KrlCtx } from "krl-stdlib";
import {
    overwriteFile,
    getSolidDataset,
    getContainedResourceUrlAll,
    getFile,
    isRawData,
    getContentType, 
    getSourceUrl,
    createContainerAt,
    deleteContainer,
    deleteFile,
    universalAccess,
	saveFileInContainer,
} from '@inrupt/solid-client';
import {
    createDpopHeader, 
    generateDpopKeyPair,
    buildAuthenticatedFetch,
} from '@inrupt/solid-client-authn-core';
import * as fs from "fs";


const STORAGE_ENT_NAME : string = "__pods_storageURL";
const MODULE_NAME : string = "pods";
const CLIENT_ID_ENT_NAME : string = "__pods_clientID";
const CLIENT_SECRET_ENT_NAME : string = "__pods_clientSecret";
const TOKEN_URL_ENT_NAME : string = "__pods_tokenURL";
let authFetch : (typeof fetch);
let accessToken : string | undefined;
let accessTokenReceiveTime : number | undefined;
let accessTokenValidDuration : number | undefined;


const getStorage = krl.Function([], async function() : Promise<string | undefined> {
	return this.rsCtx.getEnt(STORAGE_ENT_NAME);
});
const setStorage = krl.Action(["new_URL"], async function(new_URL : string | undefined) {
	this.rsCtx.putEnt(STORAGE_ENT_NAME, new_URL);
});
const getClientID = krl.Function([], async function() : Promise<string | undefined> {
	return this.rsCtx.getEnt(CLIENT_ID_ENT_NAME);
});
const setClientID = krl.Action(["new_ID"], async function(new_ID : string | undefined) {
	this.rsCtx.putEnt(CLIENT_ID_ENT_NAME, new_ID);
});
const getClientSecret = krl.Function([], async function() : Promise<string | undefined> {
	return this.rsCtx.getEnt(CLIENT_SECRET_ENT_NAME);
});
const setClientSecret = krl.Action(["new_Secret"], async function(new_Secret : string | undefined) {
	this.rsCtx.putEnt(CLIENT_SECRET_ENT_NAME, new_Secret);
});
const getRefreshTokenURL = krl.Function([], async function() : Promise<string | undefined> {
	return this.rsCtx.getEnt(TOKEN_URL_ENT_NAME);
});
const setRefreshTokenURL = krl.Action(["new_URL"], async function(new_URL : string | undefined) {
	this.rsCtx.putEnt(TOKEN_URL_ENT_NAME, new_URL);
});
const getAccessToken = krl.Function([], async function() : Promise<string | undefined> {
	return accessToken;
});
const setAccessToken = krl.Action(["new_Token"], async function(new_Token : string | undefined) {
	accessToken = new_Token;
});
const getAccessTokenReceiveTime = krl.Function([], async function() : Promise<number | undefined> {
	return accessTokenReceiveTime
});
const setAccessTokenReceiveTime = krl.Action(["new_obj"], async function(new_obj : number | undefined) {
	accessTokenReceiveTime = new_obj;
});
const getAccessTokenValidDuration = krl.Function([], async function() : Promise<number | undefined> {
	return accessTokenValidDuration;
});
const setAccessTokenValidDuration = krl.Action(["new_obj"], async function(new_obj : number | undefined) {
	accessTokenValidDuration = new_obj;
});

function getCurrentTimeInSeconds() : number {
	return new Date().getTime() / 1000;
}
const hasValidAccessToken = krl.Function([], async function() {
	let accessToken = await getAccessToken(this, []);
	let receiveTime = await getAccessTokenReceiveTime(this, []);
	let validDuration = await getAccessTokenValidDuration(this, []);
	if (!accessToken || !receiveTime || !validDuration) {
		return false;
	}
    const currentTime = getCurrentTimeInSeconds();
    this.log.debug("Current Time: " + String(currentTime) + ", " +
                    "Receive Time: " + String(receiveTime));
    this.log.debug("Valid Duration: " + String(validDuration) + ", " +
                    "Current Duration: " + String(currentTime - receiveTime));
    if (currentTime-receiveTime > validDuration) {
        return false;
    }
	return true;
});
const isStorageConnected = krl.Function([], async function() : Promise<boolean> {
    const storeURL : string | undefined = await getStorage(this, []);
	if (!storeURL) {
		return false;
	}
	return true;
});

async function getBlob(originURL : string) {
    let data : Blob;
    if (originURL.startsWith("file://")) {
		let response = fs.readFileSync(new URL(originURL));
		data = new Blob([response]);
	} else {
    	let response = await fetch(originURL);
		data = await response.blob();
    }
    return data;
}
async function createFileObject(data : Blob, url : string, functionName : string) : Promise<File> {
    let fileName : string;

    //Get file name
    //Forward Slash Filename
    let fS_filename = url.split('/').pop();
    //Backward Slash Filename
    let bS_filename = url.split('\\').pop();
    if (typeof fS_filename === "undefined" && typeof bS_filename === "undefined") {
        fileName = url;
    } else if (typeof fS_filename === "undefined" || fS_filename.length == 0) {
        fileName = <string>bS_filename;
    } else if (typeof bS_filename === "undefined" || bS_filename.length == 0) {
        fileName = fS_filename;
    } else if (fS_filename.length > bS_filename.length) {
        fileName = bS_filename;
    } else {
        fileName = fS_filename;
    }
    if (typeof fileName === "undefined") {
        throw MODULE_NAME + ":" + functionName + " could not define file name.";
    }
    if (fileName.length == 0) {
        throw MODULE_NAME + ":" + functionName + " detected a file name of length 0.";
    }
    
    let file = new File([data], <string>fileName);
    return file;
}

const authenticate = krl.Action([], async function authenticate() {
    // A key pair is needed for encryption.
    // This function from `solid-client-authn` generates such a pair for you.
    const dpopKey = await generateDpopKeyPair();

    // These are the ID and secret generated in the previous step.
    // Both the ID and the secret need to be form-encoded.
    const authString = `${encodeURIComponent(await getClientID(this, []))}:${encodeURIComponent(await getClientSecret(this, []))}`;
    // This URL can be found by looking at the "token_endpoint" field at
    // http://localhost:3000/.well-known/openid-configuration
    // if your server is hosted at http://localhost:3000/.
    const tokenUrl = await getRefreshTokenURL(this, []);
    const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
        // The header needs to be in base64 encoding.
        authorization: `Basic ${Buffer.from(authString).toString('base64')}`,
        'content-type': 'application/x-www-form-urlencoded',
        dpop: await createDpopHeader(tokenUrl, 'POST', dpopKey),
    },
    body: 'grant_type=client_credentials&scope=webid',
    });

    // This is the Access token that will be used to do an authenticated request to the server.
    // The JSON also contains an "expires_in" field in seconds,
    // which you can use to know when you need request a new Access token.
	let response_json = await response.json();
    const { access_token: accessToken } = response_json;
	const { expires_in : expiresIn } = response_json;
	const token_now = getCurrentTimeInSeconds();
	await setAccessToken(this, [accessToken]);
	await setAccessTokenReceiveTime(this, [token_now]);
	await setAccessTokenValidDuration(this, [expiresIn]);
	this.log.debug("Access Token expires in " + String(expiresIn) + " seconds.");

    authFetch = await buildAuthenticatedFetch(accessToken, { dpopKey });
});

/**
 * This function checks the access token's expiration and authenticates a single time if the token has expired.
 * If the token succeeds validation at any point, the function returns true immediately.
 * If the token is still failing validation after an authenticate() call, the function returns a false.
 */
const autoAuth = krl.Action([], async function() : Promise<Boolean> {
    this.log.debug("Automatically authenticating...");
    let is_valid = await hasValidAccessToken(this, []);
    if (is_valid) {
        return true;
    }
    await authenticate(this, []);
    is_valid = await hasValidAccessToken(this, []);
    if (is_valid) {
        return true;
    }
    return false;
});
const connectStorage = krl.Action(["storageURL", "clientID", "clientSecret", "tokenURL"], 
									async function(
										storageURL : string,
										clientID : string, 
										clientSecret : string, 
										tokenURL : string) {
	if (await isStorageConnected(this, [])) {
		throw MODULE_NAME + ":connectStorage cannot connect an already-connected Pico.";
	}
	await setStorage(this, [storageURL]);
	await setClientID(this, [clientID]);
	await setClientSecret(this, [clientSecret]);
	await setRefreshTokenURL(this, [tokenURL]);

	await authenticate(this, []);
	if (!await hasValidAccessToken(this, [])) {
        await disconnectStorage(this, []);
		throw MODULE_NAME + ":authenticate could not authenticate.";
	}

	return getStorage(this, []);
});
const disconnectStorage = krl.Action([], async function() {
	if (!await isStorageConnected(this, [])) {
		throw MODULE_NAME + ":disconnectStorage cannot disconnect an unconnected Pico.";
	}
	await setStorage(this, [undefined]);
	await setClientID(this, [undefined]);
	await setClientSecret(this, [undefined]);
	await setRefreshTokenURL(this, [undefined]);
	await setAccessToken(this, [undefined]);
	await setAccessTokenReceiveTime(this, [undefined]);
	await setAccessTokenValidDuration(this, [undefined]);
	return "Disconnected successfully.";
});

/**
 * Stores a file in the connected Pod storage if the given Storage's directory to the file 
 * already exists and the file does not already exist.
 * @param originURL A required parameter for the location that the file is loaded into memory from. Must be an absolute url.
 * @param destinationURL A required parameter for the location in the Pod to store the file in. Must be an absolute url.
 * @param fileName An optional parameter for setting the file's name when it is stored in the Pod storage.
 */
const store = krl.Action(["originURL", "destinationURL", "doAutoAuth"], 
                        async function(
                            originURL : string, 
                            destinationURL : string,
                            doAutoAuth : Boolean = true
                            ) {
    const FUNCTION_NAME = "store";
	if (!await isStorageConnected(this, [])) {
		throw MODULE_NAME + ":" + FUNCTION_NAME + " needs a Pod to be connected.";
	}
    if (doAutoAuth) {
        if (!await autoAuth(this, [])) {
            throw MODULE_NAME + ":" + FUNCTION_NAME + " could not validate Pod access token.";
        }
    }
	
    let file : File = await getNonPodFile(this, [originURL, destinationURL, FUNCTION_NAME])

    //(Rushed) code to keep it in line with overwrite() and have file names at the end of destination URLs.
    let fS_filename : string | undefined = destinationURL.split("/").pop();
    let bS_filename : string | undefined = destinationURL.split("\\").pop();
    let newDestinationURL : string = destinationURL;
    if (typeof fS_filename === "undefined" && typeof bS_filename === "undefined") {
        newDestinationURL = destinationURL;
    } else if (typeof fS_filename === "undefined" || fS_filename.length == 0) {
        let destArray : Array<string> = destinationURL.split("\\");
        destArray.pop();
        newDestinationURL = <string>destArray.join("\\");
    } else if (typeof bS_filename === "undefined" || bS_filename.length == 0) {
        let destArray : Array<string> = destinationURL.split("/");
        destArray.pop();
        newDestinationURL = <string>destArray.join("/");
    } else if (fS_filename.length > bS_filename.length) {
        let destArray : Array<string> = destinationURL.split("\\");
        destArray.pop();
        newDestinationURL = <string>destArray.join("\\");
    } else {
        let destArray : Array<string> = destinationURL.split("/");
        destArray.pop();
        newDestinationURL = <string>destArray.join("/");
    }
    newDestinationURL = newDestinationURL + "/";
    this.log.debug("Destination: " + newDestinationURL);
    
    
    saveFileInContainer(
        newDestinationURL,
        file,
        { fetch: authFetch }
    )
    .then(() => {
        this.log.debug("File uploaded successfully!\n");
    })
    .catch(error => {
        this.log.error("Error uploading file: ", error.message);
    });
});


const overwrite = krl.Action(["originURL", "destinationURL", "doAutoAuth"], 
                            async function(
                                originURL : string, 
                                destinationURL : string,
                                doAutoAuth : Boolean = true
                                ) {
    const FUNCTION_NAME = "overwrite";
	if (!await isStorageConnected(this, [])) {
		throw MODULE_NAME + ":" + FUNCTION_NAME + " needs a Pod to be connected.";
	}
    if (doAutoAuth) {
        if (!await autoAuth(this, [])) {
            throw MODULE_NAME + ":" + FUNCTION_NAME + " could not validate Pod access token.";
        }
    }
	
    let file : File = await getNonPodFile(this, [originURL, destinationURL, FUNCTION_NAME]);

	this.log.debug("Destination: " + destinationURL);

    overwriteFile(
        destinationURL,
        file,
        { fetch: authFetch }
    )
    .then(() => {
        this.log.debug("File uploaded successfully!\n");
    })
    .catch(error => {
        this.log.error("Error uploading file: ", error.message);
    });
});
const getNonPodFile = krl.Action(["originURL", "destinationURL", "functionName"], 
                                async function(originURL : string, destinationURL : string, functionName : string) : Promise<File> {
    let file : File;
    let blob : Blob = await getBlob(originURL);
    file = await createFileObject(blob, destinationURL, functionName);

	return file;
});

const removeFile = krl.Action(["fileURL", "doAutoAuth"], async function(fileURL : string,
                                                          doAutoAuth : Boolean = true) {
    if (doAutoAuth) {
        if (!await autoAuth(this, [])) {
            throw MODULE_NAME + ":removeFile could not validate Pod access token.";
        }
    }
    await deleteFile(fileURL, { fetch: authFetch });
    this.log.debug('File deleted successfully!\n');
});

const copyFile = krl.Action(["originURL", "destinationURL", "doAutoAuth"], 
							 async function(originURL : string, destinationURL : string, doAutoAuth : Boolean = true) {
    if (doAutoAuth) {
        if (!await autoAuth(this, [])) {
            throw MODULE_NAME + ":copyFile could not validate Pod access token.";
        }
    }
    try {
        const file = await getFile(
        originURL,               // File in Pod to Read
        { fetch: authFetch }       // fetch from authenticated session
        );
        this.log.debug( `Fetched a ${getContentType(file)} file from ${getSourceUrl(file)}.`);
        this.log.debug(`The file is ${isRawData(file) ? "not " : ""}a dataset.`);

        if (destinationURL.startsWith('http://') || destinationURL.startsWith('https://')) {
            let filename = originURL.split('/').pop();
            saveFileInContainer(
                destinationURL,
                new File([file], `${filename}`, { type : `${getContentType(file)}`}),
                { fetch: authFetch }
            )
            .then(() => {
                this.log.debug(`File copied to ${destinationURL} successfully!\n`);
            })
            .catch(error => {
                this.log.error("Error copying file:", error);
            });

        } else {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
                
            // Writing the buffer to a file
            fs.writeFile(destinationURL, buffer, (err : Error | null) => {
                if (err) {
                    this.log.error('Failed to save the file:', err);
                } else {
                    this.log.debug('File saved successfully.');
                }
            });
        }
    } catch(err) {
        this.log.error((err as Error).message);
    };
});

const pods_fetch = krl.Function(["fileURL", "doAutoAuth"], async function(fileURL : string, doAutoAuth : Boolean = true) {
    if (doAutoAuth) {
        if (!await autoAuth(this, [])) {
            throw MODULE_NAME + ":fetch could not validate Pod access token.";
        }
    }
    let file = await getFile(
        fileURL,
        { fetch: authFetch }
    )
    this.log.debug(`Fetched a ${getContentType(file)} file from ${getSourceUrl(file)}.`);
	this.log.debug(`The file is ${isRawData(file) ? "not " : ""}a dataset.`);
	this.log.debug(file + '\n');
	const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = buffer.toString('base64');
    const dataUrl = `data:${getContentType(file)};base64,${base64String}`;
	return dataUrl;
});

const listItems = krl.Function(["folderURL", "doAutoAuth"], async function(fileURL : string, doAutoAuth : Boolean = true) {
    if ((fileURL != '') && (!fileURL.endsWith('/'))) {
    	throw MODULE_NAME + ":listItems can only be called on folders (AKA containers). Ensure that folders have their trailing slash."
    }
    if (doAutoAuth) {
        if (!await autoAuth(this, [])) {
            throw MODULE_NAME + ":listItems could not validate Pod access token.";
        }
    }
    
    let dataset;
    
    try {
        dataset = await getSolidDataset(fileURL, { fetch: authFetch });
        let containedResources = getContainedResourceUrlAll(dataset)
        
        let directory : string[] = [];
        for (let i = 0; i < containedResources.length; i++) {
            let resource = containedResources[i]
            let item = resource.substring(fileURL.length, resource.length);
            directory.push(item);
        }
    
		for (let i = 0; i < directory.length; i++) {
			this.log.debug(directory[i]);
		}
        return directory;
    } catch (e) {
        this.log.error((e as Error).message);
    }
});

const findFile = krl.Function(["fileName", "doAutoAuth"], async function (fileName : string, doAutoAuth : Boolean = true) {
    if (doAutoAuth) {
        if (!await autoAuth(this, [])) {
            throw MODULE_NAME + ":findFile could not validate Pod access token.";
        }
    }
    
    // first item: get the root directory
    let baseURL = await getStorage(this, [])
    let directory = await listItems(this, [baseURL]);
    let queue : string[][] = [];
    queue.push(directory);
    let urls : string[] = []
    urls.push(baseURL);

    // using a breadth-first search, only on directories
    // each directory, when listed, returns an array (or undefined)
    while (queue.length > 0) {
        let dir = queue.shift();
        let url = urls.shift();

      // check if directory has the file
      if (dir?.includes(fileName)) {
          return url;
      }

      // go through each subdirectory and enqueue all of them
      if (dir != undefined) {
          for (let i = 0; i < dir?.length; i++) {
                let subdir = dir[i];
                if (subdir.endsWith('/')) {
                    let nextItem = await listItems(this, [url + subdir]);
                    queue.push(nextItem);
                    urls.push(url + subdir)
                }
            }
        }
    }

    // not found
    return null;
});

const createFolder = krl.Action(["folderURL", "doAutoAuth"], async function(folderURL : string, doAutoAuth : Boolean = true) {
    if (doAutoAuth) {
        if (!await autoAuth(this, [])) {
            throw MODULE_NAME + ":createFolder could not validate Pod access token.";
        }
    }
    await createContainerAt(folderURL, { fetch: authFetch});
    this.log.debug('Container created successfully!\n');
});
const removeFolder = krl.Action(["folderURL", "doAutoAuth"], async function(folderURL : string, doAutoAuth : Boolean = true) {
    if (doAutoAuth) {
        if (!await autoAuth(this, [])) {
            throw MODULE_NAME + ":removeFolder could not validate Pod access token.";
        }
    }
    await deleteContainer(folderURL, { fetch: authFetch});
    this.log.debug('Container deleted successfully!\n');
});

const getAllAgentAccess = krl.Function(["resourceURL", "doAutoAuth"], async function(resourceURL: string, doAutoAuth : Boolean = true) {
    if (doAutoAuth) {
        if (!await autoAuth(this, [])) {
            throw MODULE_NAME + ":createFolder could not validate Pod access token.";
        }
    }
    const accessByAgent : any = await universalAccess.getAgentAccessAll(resourceURL, { fetch: authFetch });
    let agents : string[] = [];
    for (const [agent, agentAccess] of Object.entries(accessByAgent)) {
      console.log(`For resource::: ${resourceURL}`);
      agents.push(agent);
      if (agentAccess === null) {
        console.log(`Could not load ${agent}'s access details.`);
      } else {
        console.log(`${agent}'s Access:: ${JSON.stringify(agentAccess)}`);
      }
    }
    return agents;
  });

const setAgentAccess = krl.Action(["resourceURL", "webID", "read", "write", "append", "doAutoAuth"], 
                    async function(resourceURL : string, webID : string, read : boolean, write : boolean = false, append : boolean = false, doAutoAuth : Boolean = true) {
    if (doAutoAuth) {
        if (!await autoAuth(this, [])) {
            throw MODULE_NAME + ":grantAgentAccess could not validate Pod access token.";
        }
    }
    universalAccess.setAgentAccess(
        resourceURL,       // resource  
        webID,   // agent
        { read: read, write: write, append: append },
        { fetch: authFetch }                      // fetch function from authenticated session
      ).then((agentAccess) => {
        this.log.debug(`For resource::: ${resourceURL}`);
        if (agentAccess === null) {
            this.log.debug(`Could not load ${webID}'s access details.`);
        } else {
            this.log.debug(`${webID}'s Access:: ${JSON.stringify(agentAccess)}`);
        }
      });
});

const getPublicAccess = krl.Function(["resourceURL", "doAutoAuth"], async function(resourceURL: string, doAutoAuth : boolean = true) {
    if (doAutoAuth) {
        if (!await autoAuth(this, [])) {
            throw MODULE_NAME + ":createFolder could not validate Pod access token.";
        }
    }
    const access = await universalAccess.getPublicAccess(resourceURL, { fetch: authFetch });
    if (access === null) {
        console.log("Could not load access details for this Resource.");
    } else {
        console.log("Returned Public Access:: ", JSON.stringify(access));
        return JSON.stringify(access.read);
    }
});

const setPublicAccess = krl.Action(["resourceURL", "read", "write", "append", "doAutoAuth"], 
                    async function(resourceURL: string, read : boolean, write : boolean = false, append : boolean = false, doAutoAuth : Boolean = true) {   
    if (doAutoAuth) {
        if (!await autoAuth(this, [])) {
            throw MODULE_NAME + ":grantPublicAccess could not validate Pod access token.";
        }
    }
    universalAccess.setPublicAccess(
        resourceURL,  // Resource
        { read: read, write: write, append: append },    // Access object
        { fetch: authFetch }                 // fetch function from authenticated session
    ).then((newAccess) => {
        if (newAccess === null) {
          this.log.debug("Could not load access details for this Resource.");
        } else {
          this.log.debug("Returned Public Access:: ", JSON.stringify(newAccess));
        }
    });
});






const pods: krl.Module = {
	connectStorage: connectStorage,
	disconnectStorage: disconnectStorage,
    isStorageConnected: isStorageConnected,
    hasValidAccessToken: hasValidAccessToken,
	store: store,
	overwrite: overwrite,
	removeFile: removeFile,
	copyFile: copyFile,
	fetch: pods_fetch,
	listItems: listItems,
    findFile: findFile,
	createFolder: createFolder,
	removeFolder: removeFolder,

    //The following are helper functions that are exported for testing
	getStorage : getStorage, //Private KRL helper function, does not need to be exported but may be useful for the developer
	// setStorage : setStorage, //Private KRL helper function, does not need to be exported
	// setClientID: setClientID, //Private KRL helper function, does not need to be exported
	// setClientSecret: setClientSecret, //Private KRL helper function, does not need to be exported
	// setRefreshTokenURL: setRefreshTokenURL, //Private KRL helper function, does not need to be exported

	getAccessTokenValidDuration : getAccessTokenValidDuration, //Mostly private KRL helper function, but exported since developer may want to know about the token
	getAccessTokenReceiveTime : getAccessTokenReceiveTime, //Mostly private KRL helper function, but exported since developer may want to know about the token

	authenticate: authenticate,
    getAllAgentAccess: getAllAgentAccess,
    setAgentAccess: setAgentAccess,
    getPublicAccess: getPublicAccess,
    setPublicAccess: setPublicAccess,
}

export default pods;
