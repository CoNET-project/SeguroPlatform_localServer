"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTestAccount = void 0;
const openpgp_1 = require("openpgp");
const async_1 = require("async");
const uuid_1 = require("uuid");
const util_1 = require("util");
const crypto_1 = require("crypto");
const http_1 = require("http");
const WS = require("ws");
const imapAccountArray = [
    {
        "provide": "iCloud",
        "accounts": [
            {
                "imap_server": "imap.mail.me.com",
                "imap_username": "qtgate_test2@icloud.com",
                "imap_user_password": "cfes-ofqz-khho-dppa",
                "imap_port_number": 993
            }
        ],
        "server_folder": "f1ec9226-f35b-41e6-a6cf-b273c3e52e77"
    },
    {
        "provide": "Yahoo",
        "accounts": [
            {
                "imap_server": "imap.mail.yahoo.com",
                "imap_username": "connect1@kloak.io",
                "imap_user_password": "qcjuxlyofnlbluml",
                "imap_port_number": 993
            }
        ],
        "server_folder": "35a5babb-c879-44c2-b2fd-62e40db5bbf4"
    },
    {
        "provide": "office365",
        "accounts": [
            {
                "imap_server": "outlook.office365.com",
                "imap_username": "connect1@kloak.app",
                "imap_user_password": "fdvkgpmhnnqbwjpw",
                "imap_port_number": 993
            }
        ],
        "server_folder": "3cc2baa6-31cf-49a0-bbae-df666341c2d8"
    },
    {
        "provide": "Zoho",
        "accounts": [
            {
                "imap_server": "imap.zoho.com",
                "imap_username": "connect_zoho1@kloak.io",
                "imap_user_password": "mu09QMmf6yTQ",
                "imap_port_number": 993
            }
        ],
        "server_folder": "3c9d609f-7e1d-4bd7-9951-a344eb9d682e"
    }
];
const seguroKey = `
-----BEGIN PGP PUBLIC KEY BLOCK-----

mDMEYF/6PRYJKwYBBAHaRw8BAQdATMNoTXLMBPzVgMcgwDIJT42QkNuOOwjRLpHF
K2q58la0G1NFR1VSTyA8aW5mb0BnZXRTRUdVUk8uY29tPoiPBBAWCgAgBQJgX/o9
BgsJBwgDAgQVCAoCBBYCAQACGQECGwMCHgEAIQkQvJNMcTPisIgWIQQUTeA25O28
akPm5lO8k0xxM+KwiBVMAP9cMr1pIHb8OHDNU8mW/lfD+YUVH6Qt3xJXSZvw+JUa
gAEAo+chcb5+h3SYwO7El/etUu3z+VKBaVDc1RvMzeHuug64OARgX/o9EgorBgEE
AZdVAQUBAQdAAAPmwSs9MVXDEx+c8HB0KRp7OxIGq1RswnQv/GSrbTcDAQgHiHgE
GBYIAAkFAmBf+j0CGwwAIQkQvJNMcTPisIgWIQQUTeA25O28akPm5lO8k0xxM+Kw
iEJ8AP9i3ZyodVd7wUnI8e1zuMO4hfImjsXMfp28qXQ6yBHHLQEApdtrLmxHEbwm
iUatG/EQn9VLAanhlsOMmZApsHnIxwc=
=u6x5
-----END PGP PUBLIC KEY BLOCK-----
`;
const seguroKeyID = 'BC934C7133E2B088';
const generateKey = (passwd, name, email, CallBack) => {
    const userId = {
        name: name,
        email: email
    };
    const option = {
        passphrase: passwd,
        userIDs: [userId],
        curve: "ed25519"
    };
    return openpgp_1.generateKey(option)
        .then((data) => {
        return CallBack(null, data);
    });
};
const encryptMessage = async (clearText, publicKeyArmored, privateKeyArmored, CallBack) => {
    const PrivateKey = await openpgp_1.readKey({ armoredKey: privateKeyArmored });
    const option = {
        privateKeys: PrivateKey,
        publicKeys: await openpgp_1.readKey({ armoredKey: publicKeyArmored }),
        message: await openpgp_1.createMessage({ text: clearText }),
        config: { preferredCompressionAlgorithm: openpgp_1.enums.compression.zip }
    };
    return openpgp_1.encrypt(option).then(n => {
        return CallBack(null, n);
    });
};
const encrypBySeguroMessage = async (data, CallBack) => {
    const message = JSON.parse(JSON.stringify(data));
    delete message.kloak_private;
    delete message.device_private;
    return encryptMessage(JSON.stringify(message), seguroKey, data.device_private, CallBack);
    /*
    const option = {
        privateKeys: await readKey ({ armoredKey: data.device_private }),
        publicKeys: await readKey ({ armoredKey: seguroKey }),
        message: await createMessage ({ text: }),
        config: { preferredCompressionAlgorithm: enums.compression.zip }
    }
    return encrypt ( option ).then ( n => {
        return CallBack ( null, n )
    })
    */
};
const decryptMessage = async (encryptedMessage, privateKey, publicKey, CallBack) => {
    const option = {
        privateKeys: await openpgp_1.readKey({ armoredKey: privateKey }),
        publicKeys: await openpgp_1.readKey({ armoredKey: publicKey }),
        message: await openpgp_1.readMessage({ armoredMessage: encryptedMessage })
    };
    return openpgp_1.decrypt(option).then(n => {
        return CallBack(null, n);
    }).catch(ex => {
        console.log(util_1.inspect({ decryptMessageError: ex }, false, 3, true));
        CallBack(ex);
    });
};
const requestPost = (postData, urlPath, CallBack) => {
    const PORT = 3000;
    const url = `localhost`;
    const postString = JSON.stringify(postData);
    const option = {
        host: url,
        port: PORT,
        path: urlPath,
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            'Content-Length': Buffer.byteLength(postString)
        }
    };
    let _data = '';
    const req = http_1.request(option, res => {
        res.once('error', err => {
            return CallBack(err);
        });
        res.on('data', data => {
            _data += data.toString();
        });
        res.once('end', () => {
            let ret = null;
            if (!_data) {
                return CallBack();
            }
            try {
                ret = JSON.parse(_data);
            }
            catch (ex) {
                console.log(util_1.inspect({ requestPost_JSON_parse_Error: _data }));
                return CallBack(ex);
            }
            return CallBack(null, ret);
        });
    });
    req.end(postString);
};
const requestPostLongConnect = (postData, urlPath, CallBack) => {
    const PORT = 3000;
    const url = `localhost`;
    const postString = JSON.stringify(postData);
    const option = {
        host: url,
        port: PORT,
        path: urlPath,
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            'Content-Length': Buffer.byteLength(postString)
        }
    };
    let _data = '';
    const checkEntry = () => {
        const index = _data.indexOf('\r\n\r\n');
        if (index < 0) {
            return;
        }
    };
    const req = http_1.request(option, res => {
        res.once('error', err => {
            return CallBack(err);
        });
        res.on('data', data => {
            _data += data.toString();
            checkEntry();
        });
        res.once('end', () => {
            let ret = null;
            try {
                ret = JSON.parse(_data);
            }
            catch (ex) {
                return CallBack(ex);
            }
            return CallBack(null, ret);
        });
    });
    req.end(postString);
};
const decryptMessageCheckSeguroKey = async (encryptedMessage, data, CallBack) => {
    const option = {
        privateKeys: await openpgp_1.readKey({ armoredKey: data.device_private }),
        publicKeys: await openpgp_1.readKey({ armoredKey: seguroKey }),
        message: await openpgp_1.readMessage({ armoredMessage: encryptedMessage })
    };
    return openpgp_1.decrypt(option).then(n => {
        if (n.signatures[0].keyID.toHex().toLocaleUpperCase() !== seguroKeyID) {
            return CallBack('keyid check error!');
        }
        return CallBack(null, n.data);
    });
};
const buildTestAccount = (CallBack) => {
    let deviceKey = null;
    return async_1.waterfall([
        next => generateKey('', '', '', next),
        (data, next) => {
            deviceKey = data;
            return generateKey('', '', '', next);
        }
    ], (err, data) => {
        if (err) {
            return CallBack(err);
        }
        const imapData = imapAccountArray[0]; //Math.round ( Math.random () * 2 ) ]
        const request = {
            kloak_account_armor: data.publicKeyArmored,
            kloak_private: data.privateKeyArmored,
            device_private: deviceKey.privateKeyArmored,
            device_armor: deviceKey.publicKeyArmored,
            imap_account: imapData.accounts[0],
            client_folder_name: uuid_1.v4(),
            use_kloak_shared_imap_account: true,
            server_folder: imapData.server_folder
        };
        return CallBack(null, request);
    });
};
exports.buildTestAccount = buildTestAccount;
const wsConnect = (url, sendData, CallBack) => {
    const ws = new WS(url);
    ws.on('message', message => {
        let ret = null;
        try {
            ret = JSON.parse(message);
        }
        catch (ex) {
            return console.log(`wsConnect ws.on ( 'message' )  JSON.parse Error`, ex);
        }
        return CallBack(null, ret);
    });
    ws.once('close', () => {
        console.log('on close');
    });
    ws.once('open', () => {
        return ws.send(JSON.stringify(sendData));
    });
    return ws;
};
/**
 * 				test online
 */
/*
get ('http://localhost:3000/testNetwork', res => {
    let data = ''
    res.on ('data', _data => {
        data += _data.toString ()
    })
    res.once ('end', () => {
        console.log ( inspect ({ success: data }, false, 3, true ))
    })

}).once ('error', err => {
    console.log (`localhost:3000 has shutdown!`)
})

/** */
/**
 * 				TEST unit for generateKey
 */
/*
generateKey ('', '','',( err, data ) => {
    if ( err ) {
        return console.log ( inspect ({ generateKey_error: err }, false, 3, true ))
    }
    console.log ( inspect ({ generateKey_success: data }, false, 3, true ))
})

/** */
/**
 * 				TEST for encrypBySeguroMessage
 */
/*

 let requestData: connectRequest_test = null
 let hash1 = ''
 waterfall ([
    next => buildTestAccount ( next ),							//			Init device and Seguro key, puckup a Seguro public listening channel IMAP
    
    ( data, next ) => {
        requestData = data
        return encrypBySeguroMessage ( requestData, next )		//			create IMAP request
    }], ( err, data ) => {
        if ( err ) {
            return console.log ( inspect ({ encrypBySeguroMessage_error: err }, false, 3, true ))
        }
        console.log ( inspect ({ encrypBySeguroMessage_success: data }, false, 3, true ))
    })




/**
 *
 * 			test unit for try connect to Seguro network
 */
let requestData = null;
let hash1 = '';
async_1.waterfall([
    next => exports.buildTestAccount(next),
    (data, next) => {
        requestData = data;
        return encrypBySeguroMessage(requestData, next); //			create IMAP request 
    },
    (data, next) => {
        requestData.encrypted_request = data;
        hash1 = crypto_1.createHash('sha256').update(data).digest('hex');
        console.time(`requestPost [${hash1}]`);
        return requestPost(requestData, '/getInformationFromSeguro', next); //	post request
    },
    (data, next) => {
        if (data.error) {
            return next(data.error);
        }
        console.timeEnd(`requestPost [${hash1}]`);
        return decryptMessageCheckSeguroKey(requestData.encrypted_response = data.encrypted_response, requestData, next); //	decrypt response
    },
    (data, next) => {
        let respon = null;
        try {
            respon = requestData.reponseJson = JSON.parse(data);
        }
        catch (ex) {
            return next(ex);
        }
        //console.log ( inspect ( requestData, false, 3, true ))
        console.time(`Seguro connected [${hash1}]`);
        let callbak = false; //	try connect Seguro use responsed connect_info
        const ws = wsConnect('ws://localhost:3000/connectToSeguro', respon.connect_info, (err, data) => {
            if (err) {
                console.timeEnd(`Seguro connected [${hash1}]`);
                console.time(`first connecting connected! [${hash1}]`);
                console.log(util_1.inspect(`wsConnect callback err ${err.message}`, false, 1, true));
                if (!callbak) {
                    return next(err);
                }
                return;
            }
            if (/Connected/.test(data.status)) {
                callbak = true;
                console.timeEnd(`Seguro connected [${hash1}]`);
                return setTimeout(() => {
                    ws.close();
                    return next();
                }, 1000 * 60 * 60 * 12);
            }
            console.log(util_1.inspect(data, false, 3, true));
        });
    },
    next => {
        console.time(`requestPost use next connect_info [${hash1}]`); //	post request to next_time_connect
        requestData.imap_account = JSON.parse(JSON.stringify(requestData.reponseJson.next_time_connect.imap_account));
        requestData.server_folder = requestData.reponseJson.next_time_connect.server_folder;
        delete requestData.encrypted_response;
        delete requestData.reponseJson;
        console.log(util_1.inspect({ startToGetConnectDatFromAP_use_next_imapInfo: 'Call /getInformationFromSeguro !', requestData: requestData }, false, 3, true));
        return requestPost(requestData, '/getInformationFromSeguro', next);
    },
    (data, next) => {
        if (data.error) {
            return next(data.error);
        }
        //console.log ( inspect ({ requestPost_next_callback: data }, false, 3, true ))													//	decrypt response
        return decryptMessageCheckSeguroKey(requestData.encrypted_response = data.encrypted_response, requestData, next);
    },
    (data, next) => {
        console.timeEnd(`requestPost use next connect_info [${hash1}]`);
        let respon = null;
        try {
            respon = requestData.reponseJson = JSON.parse(data);
        }
        catch (ex) {
            return next(ex);
        }
        console.time(`connected to Seguro use next_connect_info [${hash1}]`);
        console.log(util_1.inspect(requestData, false, 3, false)); //	try connect Seguro use responsed next_connect_info
        let callbak = false;
        const ws = wsConnect('ws://localhost:3000/connectToSeguro', respon.connect_info, (err, data) => {
            if (err) {
                if (!callbak) {
                    return next(err);
                }
                return;
            }
            if (/Connected/.test(data.status)) {
                callbak = true;
                console.timeEnd(`connected to Seguro use next_connect_info [${hash1}]`);
                return setTimeout(() => {
                    ws.close();
                    return next();
                }, 2000);
            }
            console.log(util_1.inspect(data, false, 4, true));
        });
    }
], (err, message) => {
    if (err) {
        return console.log(err);
    }
    console.log(util_1.inspect(message, false, 3, true));
});
/** */
/**
 *
 * 			test unit for local develop test, two devices doing communication, device2 send message to device1
 */
/*

let requestData1: connectRequest_test = null
let requestData: connectRequest_test = null
let ws1 = null
let ws2 = null
waterfall ([
    next => buildTestAccount ( next ),							//			Init device1 and Seguro key, puckup a Seguro public
    ( data, next ) => {
        requestData = data
        return buildTestAccount ( next )						//			Init device2 and Seguro key, puckup a Seguro public
    },
    ( data, next ) => {
        requestData1 = data
        ws1 = wsConnect ( 'ws://localhost:3000/peerToPeerConnecting', requestData, ( err, response1 ) => {
            if ( err ) {
                return next ( err )
            }
            console.log ( inspect ( { device1ConnectToWs: response1 }, false, 3, true ))
            if ( response1.key_ids ) {
                
                return ws2 = wsConnect ( 'ws://localhost:3000/peerToPeerConnecting', requestData1, ( err, data1 ) => {
                    if ( err ) {
                        return next ( err )
                    }
                    
                    console.log ( inspect ( { device2ConnectToWs: data1 }, false, 3, true ))
                    
                    return encryptMessage ( 'hello device1',
                        requestData.device_armor, 			//			device1 public key
                        requestData1.device_private, 		//			device2 private key sign
                        next )
                })
            }
            
            return decryptMessage ( response1.encryptedMessage, requestData.device_private, requestData1.device_armor, ( err, data2 ) => {
                console.log ( inspect ( { decryptMessageCallBack: 'SUCCESS!'}, false, 3, true ))
                let response = null
                
                console.log ( inspect ({ getMessageFromDevice2 : data2.data }, false, 3, true ))
                ws1.close ()
                ws2.close ()
            })
        })
    },
    ( data, next ) => requestPost ( { encryptedMessage: data }, '/postMessage', next )
    ], ( data, err ) => {
    if ( err ) {
        return console.log ( err )
    }
    console.log (`requestPost success!`)
})
/** */
/**
 *
 * 			TEST for Access Point hold message and re-send when Device1 re-connect to Seguro network
 */
/*
 let requestData1: connectRequest_test = null
 let requestData2: connectRequest_test = null
 
 
 waterfall ([
     next => buildTestAccount ( next ),							//			Init device1 and Seguro key, puckup a Seguro public listening channel IMAP
     
     ( data, next ) => {
         requestData1 = data
         return encrypBySeguroMessage ( requestData1, next )		//			create IMAP request
     },
     ( data, next ) => {
         requestData1.encrypted_request = data
         console.time (`device1 requestPost`)
         return requestPost ( requestData1, '/getInformationFromSeguro', next ) 		//	post request
     },
     ( data: connectRequest_test, next ) => {
         console.timeEnd (`device1 requestPost`)
         return decryptMessageCheckSeguroKey ( requestData1.encrypted_response = data.encrypted_response, requestData1, next )		//	decrypt response
     },
     
     ( data, next ) => {
         let respon: connectRequest_test = null
         try {
             respon = requestData1.reponseJson = JSON.parse ( data )
         } catch ( ex ) {
             return next ( ex )
         }
         console.time (`Device1 start connect to Seguro`)
                                                                                //	try connect Seguro use responsed connect_info
        requestData1.ws_Obj = wsConnect ( 'ws://localhost:3000/connectToSeguro', respon.connect_info, ( err, data: postData ) => {
            
             if ( err ) {
                 console.log ( inspect ({ ws_device1_Error: err }, false, 2, true ))
                 return next ( err )
             }
             
             if ( /Connected/.test ( data.status )) {
                 console.timeEnd (`Device1 start connect to Seguro`)
                 requestData1.ws_handle = data
                 requestData1.ws_Obj.close ()									//		Stop
                 
                 return buildTestAccount ( next )																//		init device2
             }
             
             return console.log ( inspect ( { requestData1_wsConnect_getMessage: data }, false, 3, true ))
         })
          
 
     },
     
     ( data, next ) => {
        requestData2 = data
        return encrypBySeguroMessage ( requestData2, next )		//			create IMAP request
     },
     ( data, next ) => {
        requestData2.encrypted_request = data

        console.time (`Device2 requestPost`)
        return requestPost ( requestData2, '/getInformationFromSeguro', next ) 		//	post request
     },
     ( data, next ) => {
        console.timeEnd (`Device2 requestPost`)
        return decryptMessageCheckSeguroKey ( requestData2.encrypted_response = data.encrypted_response, requestData2, next )		//	decrypt response
     },
     ( data, next ) => {
        let respon: connectRequest_test = null
        try {
            respon = requestData2.reponseJson = JSON.parse ( data )
        } catch ( ex ) {
            return next ( ex )
        }
        console.time (`Device2 start connect to Seguro`)
        requestData2.ws_Obj = wsConnect ( 'ws://localhost:3000/connectToSeguro', respon.connect_info, ( err, data: postData ) => {
            
             if ( err ) {
                 console.log ( inspect ({ ws_device2_Error: err }, false, 2, true ))
                 return next ( err )
             }
             
             if ( /Connected/.test ( data.status )) {
                 console.timeEnd (`Device2 start connect to Seguro`)
                 requestData2.ws_handle = data
                 console.time (`Send message to Device1 finished`)
                 return encryptMessage ( 'hello device1',
                        requestData1.device_armor, 			//			device1 public key
                        requestData2.device_private, 		//			device2 private key sign
                        next )
             }
             
             return console.log ( inspect ( { requestData2_wsConnect_getMessage: data }, false, 3, true ))
         })
     },
     ( data, next ) => requestPost ( { encryptedMessage: data, connectUUID: requestData2.ws_handle.connectUUID }, '/postMessage', next ),

     ( data, next ) => {
         if ( !next ) {
             next = data
         }
        requestData2.ws_Obj.close ()
         //						waiting 5 seconds then try connect to device1 get message which from device2
         setTimeout (() => {
            console.time (`Device1 re-connect to Seguro`)
            requestData1.ws_Obj = wsConnect ( 'ws://localhost:3000/connectToSeguro', requestData1.reponseJson.connect_info, ( err, data: postData ) => {
                if ( err ) {
                    console.log ( inspect ({ ws_device1_Error: err }, false, 2, true ))
                    return next ( err )
                }
                if ( /Connected/.test ( data.status )) {
                    console.timeEnd (`Device1 re-connect to Seguro`)
                    
                }
                if ( data.encryptedMessage ) {																		//		get message from device2
                    return decryptMessage ( data.encryptedMessage, requestData1.device_private, requestData2.device_armor, ( err, data ) => {
                        if ( err ) {
                            return console.log ( inspect ({ ws_device1_decryptMessage_Error: err }, false, 2, true ))
                             
                        }
                        
                        console.log ( inspect ( { requestData1_wsConnect_getNncryptedMessage: data.data }, false, 3, true ))
                        requestData1.ws_Obj.close ()
                        next ()
                    })

                }
                return console.log ( inspect ( { requestData1_wsConnect_getMessage: data }, false, 3, true ))

            })
         }, 1000 * 5 )
        
     }
     
 ],
 
 ( err, message ) => {
     if ( err ) {
         return console.log ( err )
     }
     console.log ( inspect ( { Async_end: message }, false, 3, true ))
 })





/** */
/**
 *
 * 			test unit for try connect to Seguro network
 * 			device2 send message to device1
 */
/*

 let requestData1: connectRequest_test = null
 let requestData2: connectRequest_test = null
 
 const endAll = () => {
    requestData1.ws_Obj.close ()
    requestData2.ws_Obj.close ()
 }
 waterfall ([
     next => buildTestAccount ( next ),							//			Init device1 and Seguro key, puckup a Seguro public listening channel IMAP
     
     ( data, next ) => {
         requestData1 = data
         return encrypBySeguroMessage ( requestData1, next )		//			create IMAP request
     },
     ( data, next ) => {
         requestData1.encrypted_request = data
         console.time (`device1 requestPost`)
         return requestPost ( requestData1, '/getInformationFromSeguro', next ) 		//	post request
     },
     ( data: connectRequest_test, next ) => {
         console.timeEnd (`device1 requestPost`)
         return decryptMessageCheckSeguroKey ( requestData1.encrypted_response = data.encrypted_response, requestData1, next )		//	decrypt response
     },
     
     ( data, next ) => {
         let respon: connectRequest_test = null
         try {
             respon = requestData1.reponseJson = JSON.parse ( data )
         } catch ( ex ) {
             return next ( ex )
         }
         console.time (`Device1 start connect to Seguro`)
 
                                                                                //	try connect Seguro use responsed connect_info
        requestData1.ws_Obj = wsConnect ( 'ws://localhost:3000/connectToSeguro', respon.connect_info, ( err, data: postData ) => {
            
             if ( err ) {
                 console.log ( inspect ({ ws_device1_Error: err }, false, 2, true ))
                 return next ( err )
             }
             
             if ( /Connected/.test ( data.status )) {
                 console.timeEnd (`Device1 start connect to Seguro`)
                 requestData1.ws_handle = data
                 return buildTestAccount ( next )																//		init device2
             }

             if ( data.encryptedMessage ) {																		//		get message from device2
                return decryptMessage ( data.encryptedMessage, requestData1.device_private, requestData2.device_armor, ( err, data ) => {
                    if ( err ) {
                        return console.log ( inspect ({ ws_device1_decryptMessage_Error: err }, false, 2, true ))
                        
                    }
                    console.timeEnd (`Send message to Device1 finished`)
                    console.log ( inspect ( { requestData1_wsConnect_getMessage: data.data }, false, 3, true ))
                    endAll ()
                })
             }
             
             return console.log ( inspect ( { requestData1_wsConnect_getMessage: data }, false, 3, true ))
         })
          
 
     },
     ( data, next ) => {
        requestData2 = data
        return encrypBySeguroMessage ( requestData2, next )		//			create IMAP request
     },
     ( data, next ) => {
        requestData2.encrypted_request = data

        console.time (`Device2 requestPost`)
        return requestPost ( requestData2, '/getInformationFromSeguro', next ) 		//	post request
     },
     ( data, next ) => {
        console.timeEnd (`Device2 requestPost`)
        return decryptMessageCheckSeguroKey ( requestData2.encrypted_response = data.encrypted_response, requestData2, next )		//	decrypt response
     },
     ( data, next ) => {
        let respon: connectRequest_test = null
        try {
            respon = requestData2.reponseJson = JSON.parse ( data )
        } catch ( ex ) {
            return next ( ex )
        }
        console.time (`Device2 start connect to Seguro`)
        requestData2.ws_Obj = wsConnect ( 'ws://localhost:3000/connectToSeguro', respon.connect_info, ( err, data: postData ) => {
            
             if ( err ) {
                 console.log ( inspect ({ ws_device2_Error: err }, false, 2, true ))
                 return next ( err )
             }
             
             if ( /Connected/.test ( data.status )) {
                 console.timeEnd (`Device2 start connect to Seguro`)
                 requestData2.ws_handle = data
                 console.time (`Send message to Device1 finished`)
                 return encryptMessage ( 'hello device1',
                        requestData1.device_armor, 			//			device1 public key
                        requestData2.device_private, 		//			device2 private key sign
                        next )
             }
             
             return console.log ( inspect ( { requestData2_wsConnect_getMessage: data }, false, 3, true ))
         })
     },
     ( data, next ) => requestPost ( { encryptedMessage: data, connectUUID: requestData2.ws_handle.connectUUID }, '/postMessage', next )
 
 ], ( err, message ) => {
     if ( err ) {
         return console.log ( err )
     }
     console.log ( inspect ( { Async_end: message }, false, 3, true ))
 })
 /** */
