"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTestAccount = void 0;
const Openpgp = require("openpgp");
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
        userIds: [userId],
        curve: "ed25519",
        aead_protect: false,
        //aead_protect_version: 4
    };
    return Openpgp.generateKey(option)
        .then((data) => {
        return CallBack(null, data);
    });
};
const encrypBySeguroMessage = async (data, CallBack) => {
    const message = JSON.parse(JSON.stringify(data));
    delete message.kloak_private;
    delete message.device_private;
    const option = {
        privateKeys: await Openpgp.readKey({ armoredKey: data.device_private }),
        publicKeys: await Openpgp.readKey({ armoredKey: seguroKey }),
        message: await Openpgp.Message.fromText(JSON.stringify(message)),
        compression: Openpgp.enums.compression.zip
    };
    return Openpgp.encrypt(option).then(n => {
        return CallBack(null, n);
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
        privateKeys: await Openpgp.readKey({ armoredKey: data.device_private }),
        publicKeys: await Openpgp.readKey({ armoredKey: seguroKey }),
        message: await Openpgp.readMessage({ armoredMessage: encryptedMessage })
    };
    return Openpgp.decrypt(option).then(n => {
        if (n.signatures[0].keyid.toHex().toLocaleUpperCase() !== seguroKeyID) {
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
        return CallBack(new Error('Closed'));
    });
    ws.once('open', () => {
        return ws.send(JSON.stringify(sendData));
    });
    return ws;
};
/**
 *
 * 			test unit
 */
let requestData = null;
let hash1 = '';
async_1.waterfall([
    next => exports.buildTestAccount(next),
    (data, next) => {
        requestData = data;
        return encrypBySeguroMessage(requestData, next);
    },
    (data, next) => {
        requestData.encrypted_request = data;
        hash1 = crypto_1.createHash('sha256').update(data).digest('hex');
        console.time(`requestPost [${hash1}]`);
        return requestPost(requestData, '/getInformationFromSeguro', next);
    },
    (data, next) => {
        console.timeEnd(`requestPost [${hash1}]`);
        hash1 = crypto_1.createHash('sha256').update(data.encrypted_response).digest('hex');
        return decryptMessageCheckSeguroKey(requestData.encrypted_response = data.encrypted_response, requestData, next);
    }
    /*
    ( data, next ) => {
        let respon: connectRequest_test = null
        try {
            respon = requestData.reponseJson = JSON.parse ( data )
        } catch ( ex ) {
            return next ( ex )
        }
        console.log ( inspect ( requestData, false, 3, true ))
        console.time (`start connect to Seguro [${ hash1 }]`)

        let callbak = false
        const ws = wsConnect ( 'ws://localhost:3000/connectToSeguro', respon.connect_info, ( err, data ) => {
            console.timeEnd (`start connect to Seguro [${ hash1 }]`)
            if ( err ) {
                console.log ( inspect (`wsConnect callback err ${ err.message }`, false, 1, true ))
                if ( !callbak ) {
                    return next ( err )
                }
                return
            }
            
            if ( /Connected/.test ( data.status )) {
                callbak = true
                console.timeEnd (`start connect to Seguro [${ hash1 }]`)
                ws.close ()
                return setTimeout (() => {
                    
                    return next ()
                }, 2000 )
            }
            
            console.log ( inspect ( data, false, 3, true ))
        })

    },
    
    next => {
        requestData.imap_account = requestData.reponseJson.next_time_connect.imap_account
        requestData.server_folder = requestData.reponseJson.next_time_connect.server_folder
        console.log ( inspect ({ startToGetConnectDatFromAP: 'Call /getInformationFromSeguro !' }))
        return requestPost ( requestData, '/getInformationFromSeguro', next )
    },
    ( data: connectRequest_test, next ) => {
        console.timeEnd (`requestPost [${ hash1 }]`)
        hash1 = createHash ('sha256').update ( data.encrypted_response ).digest ('hex')
        return decryptMessageCheckSeguroKey ( requestData.encrypted_response = data.encrypted_response, requestData, next )
    },
    ( data, next ) => {
        let respon: connectRequest_test = null
        try {
            respon = requestData.reponseJson = JSON.parse ( data )
        } catch ( ex ) {
            return next ( ex )
        }
        console.time ( `start connect to Seguro [${ hash1 }]`)
        console.log ( inspect ( requestData, false, 3, false ))
        let callbak = false
        const ws = wsConnect ( 'ws://localhost:3000/connectToSeguro', respon.connect_info, ( err, data ) => {
            if ( err ) {
                if ( !callbak ) {
                    return next ( err )
                }
                return
            }
            if ( /Connected/.test ( data.status )) {
                callbak = true
                console.timeEnd (`start connect to Seguro [${ hash1 }]`)
                ws.close ()
                return setTimeout (() => {
                    return next ()
                }, 2000 )
            }
            console.log ( inspect ( data, false, 4, true ))

        })

    }
    /** */
], (err, message) => {
    if (err) {
        return console.log(err);
    }
    console.log(util_1.inspect(message, false, 3, true));
});
/** */
/**
 * 			test next connect
 */
const testData = {
    kloak_account_armor: '-----BEGIN PGP PUBLIC KEY BLOCK-----\n' +
        '\n' +
        'xjMEYHd22RYJKwYBBAHaRw8BAQdAiKb1PAFAnaqTvTkR3h9oeJvEWYUxEktt\n' +
        '1mylFbEbYY3NAMKMBBAWCgAdBQJgd3bZBAsJBwgDFQgKBBYCAQACGQECGwMC\n' +
        'HgEAIQkQl8Zb56SPVWwWIQSi0tNqxVJnDus3PpeXxlvnpI9VbAVcAQD1b8Fc\n' +
        'mBdFN4SqK5WGECcCNeZHaGJIo9q/XjTitzKZHwEA0CDeRUCDd/G5d/sCKcau\n' +
        'crUS7bwCTf102hi+1hgVaQ7OOARgd3bZEgorBgEEAZdVAQUBAQdANPKXnZdN\n' +
        'w4q7M4PrsHgaxiPwRwI0ebfpPbMb3i8JzREDAQgHwngEGBYIAAkFAmB3dtkC\n' +
        'GwwAIQkQl8Zb56SPVWwWIQSi0tNqxVJnDus3PpeXxlvnpI9VbBB5AQDf32Cd\n' +
        'wuszB9QgUAQUZzgNtWJyk7yOy3DmthIDcjqRRAD/WecaU7roF+2PdRnmp0tW\n' +
        '8TDz2DHy8QBNEDq8s7neNQ0=\n' +
        '=zOa9\n' +
        '-----END PGP PUBLIC KEY BLOCK-----\n',
    kloak_private: '-----BEGIN PGP PRIVATE KEY BLOCK-----\n' +
        '\n' +
        'xVgEYHd22RYJKwYBBAHaRw8BAQdAiKb1PAFAnaqTvTkR3h9oeJvEWYUxEktt\n' +
        '1mylFbEbYY0AAQCTSr8iJ3jHU01GOk9CRA71h5di6EGdJnx2qnpBEkLv6A4L\n' +
        'zQDCjAQQFgoAHQUCYHd22QQLCQcIAxUICgQWAgEAAhkBAhsDAh4BACEJEJfG\n' +
        'W+ekj1VsFiEEotLTasVSZw7rNz6Xl8Zb56SPVWwFXAEA9W/BXJgXRTeEqiuV\n' +
        'hhAnAjXmR2hiSKPav1404rcymR8BANAg3kVAg3fxuXf7AinGrnK1Eu28Ak39\n' +
        'dNoYvtYYFWkOx10EYHd22RIKKwYBBAGXVQEFAQEHQDTyl52XTcOKuzOD67B4\n' +
        'GsYj8EcCNHm36T2zG94vCc0RAwEIBwAA/1i/qgo+fppG/JfSgkSkiHC9m1GH\n' +
        'JJ5rSczGuewxu+TwEsrCeAQYFggACQUCYHd22QIbDAAhCRCXxlvnpI9VbBYh\n' +
        'BKLS02rFUmcO6zc+l5fGW+ekj1VsEHkBAN/fYJ3C6zMH1CBQBBRnOA21YnKT\n' +
        'vI7LcOa2EgNyOpFEAP9Z5xpTuugX7Y91GeanS1bxMPPYMfLxAE0QOryzud41\n' +
        'DQ==\n' +
        '=jwgF\n' +
        '-----END PGP PRIVATE KEY BLOCK-----\n',
    device_private: '-----BEGIN PGP PRIVATE KEY BLOCK-----\n' +
        '\n' +
        'xVgEYHd22RYJKwYBBAHaRw8BAQdAtjFrvRBr1svKAeHsaPetwkNT2S3Zvgp6\n' +
        'Iicm1pd9o14AAQDucm4AcbjHBNOOI/iPZFdoN31LOff8HE+w71lD1jxtdQ+2\n' +
        'zQDCjAQQFgoAHQUCYHd22QQLCQcIAxUICgQWAgEAAhkBAhsDAh4BACEJEEDV\n' +
        'nzMq+QNfFiEEhCvr/2l10ikqt/WHQNWfMyr5A191RAD9HYKtIKDdetdO1E8W\n' +
        '+aScVO9Q4IJWO6qlUicoibt9gVAA+wVcu25wyl00J3IP551ylKvemYcsgTOM\n' +
        'eICK0gCcl8YFx10EYHd22RIKKwYBBAGXVQEFAQEHQG3v96wXIqGvVWvmwqcM\n' +
        'ROMg/pp7rtGjrOPJcAg2xYkeAwEIBwAA/1LarEUUCTw3kp5THMcIpD66BBLg\n' +
        'KvvZDIQuihqTw1hIDgLCeAQYFggACQUCYHd22QIbDAAhCRBA1Z8zKvkDXxYh\n' +
        'BIQr6/9pddIpKrf1h0DVnzMq+QNfw5IBAO+GsglQ+u9n0bE9BSs6a9IIw0Wf\n' +
        'JZDsB3H3+yvMVJTUAQCmARBBZNYSu1Unpu85A2Cam1zoC72HOpg+GTl7Cgny\n' +
        'BQ==\n' +
        '=u4uC\n' +
        '-----END PGP PRIVATE KEY BLOCK-----\n',
    device_armor: '-----BEGIN PGP PUBLIC KEY BLOCK-----\n' +
        '\n' +
        'xjMEYHd22RYJKwYBBAHaRw8BAQdAtjFrvRBr1svKAeHsaPetwkNT2S3Zvgp6\n' +
        'Iicm1pd9o17NAMKMBBAWCgAdBQJgd3bZBAsJBwgDFQgKBBYCAQACGQECGwMC\n' +
        'HgEAIQkQQNWfMyr5A18WIQSEK+v/aXXSKSq39YdA1Z8zKvkDX3VEAP0dgq0g\n' +
        'oN16107UTxb5pJxU71DgglY7qqVSJyiJu32BUAD7BVy7bnDKXTQncg/nnXKU\n' +
        'q96ZhyyBM4x4gIrSAJyXxgXOOARgd3bZEgorBgEEAZdVAQUBAQdAbe/3rBci\n' +
        'oa9Va+bCpwxE4yD+mnuu0aOs48lwCDbFiR4DAQgHwngEGBYIAAkFAmB3dtkC\n' +
        'GwwAIQkQQNWfMyr5A18WIQSEK+v/aXXSKSq39YdA1Z8zKvkDX8OSAQDvhrIJ\n' +
        'UPrvZ9GxPQUrOmvSCMNFnyWQ7Adx9/srzFSU1AEApgEQQWTWErtVJ6bvOQNg\n' +
        'mptc6Au9hzqYPhk5ewoJ8gU=\n' +
        '=Avtd\n' +
        '-----END PGP PUBLIC KEY BLOCK-----\n',
    imap_account: {
        imap_server: 'imap.mail.me.com',
        imap_username: 'qtgate_test2@icloud.com',
        imap_user_password: 'cfes-ofqz-khho-dppa',
        imap_port_number: 993
    },
    client_folder_name: 'cccdeb22-13a4-40a4-a6ab-fbef012f5d72',
    use_kloak_shared_imap_account: true,
    server_folder: 'f1ec9226-f35b-41e6-a6cf-b273c3e52e77',
    encrypted_request: '-----BEGIN PGP MESSAGE-----\n' +
        '\n' +
        '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\n' +
        'Wss=\n' +
        '=h7pU\n' +
        '-----END PGP MESSAGE-----\n',
    encrypted_response: '-----BEGIN PGP MESSAGE-----\n' +
        '\n' +
        'hF4D16JX46bzJ30SAQdAz9G/d57NF4gGpS/v+yRE3QEoaqQ4fqZzSWKdgpHxiV0w\n' +
        'C0oV4BwWwk+HKZRudHFGb/5hrpNe/cW9W4mOUSTOjVgmNQqDn756EYrUtMd+eNAT\n' +
        '0ukBNYd+cYcivmR/Z9k2/WEF7UYQXNmVzbnG0AZzkbcXpfOlz1sbeM3Z8dkNFHRw\n' +
        'FnXjyWkt5n536S/elgYVWVqzSjyZ/QmZTTmIric9d95IoK+96PfGu++rwydeUbQF\n' +
        'pUkfXWDStzPqHthKbOVaa11eZXyO3UGmujIiKt8dnDJiNmyKlFt5G5npIlB+otNB\n' +
        'ZlecAXRNcekyENz8yvgXARmX9M155xS7h73RTfIIfVoCwF0aXXxZPxpCdeQTzwMT\n' +
        'DlDNhjUOMUxLnAWL/kFS3q4aEo1uoBB4uZPPodbESszAfQ20HgiuL4QPWQsQrFWR\n' +
        's6VrVxV4NeK8gLfXO0BlIr9yUTKgw49pCPBAJOuQpJ+4Nv/gk2jCiSGXJWvDM0H4\n' +
        'dRdU/rmgrhhlAciotEDpNvq59hZLStWfZa1NsUzBfvUNHczfWV6fNSPP1d5emx0O\n' +
        'ZI+beRav5ZM4A57WAcyjAAnXHjRYcX/BdqMZ7jgIzIGhCRpt5z2K1FNh+bGSaIoh\n' +
        'yq+3KyqGnVwRDIfhJAV/LgXoSTrDXpnlcMNCwHE7Yy3tVhqazqehnMVbHaC1j2QK\n' +
        '/bPop3KRNBu0fO9X/bPtgqWs2aOS6u9Y1qz9p337c4LVViQ0BOAsvTTRugAS6W1u\n' +
        'aFf0QQibT3oF9lDc+PBBSNG+2mWTVi5Z7U5qeKjjRbcbQWLwuYAQ3OqLUcWU2JZa\n' +
        'LoSRRL2P/zxTJYQ8E5up+Ngf9rLqZAmLg6OYbyEy6gb/Y7dJQIp0Tk5z4TmRoxHB\n' +
        '93vOIf/zrWKD4OQRMcj2GYpZ9Ih8RCxa0KxoCfavtz+7gQ0YSg==\n' +
        '=8gL3\n' +
        '-----END PGP MESSAGE-----\n' +
        '\r\n',
    reponseJson: {
        client_folder_name: 'cccdeb22-13a4-40a4-a6ab-fbef012f5d72',
        device_keyid: '40D59F332AF9035F',
        kloak_keyid: '97C65BE7A48F556C',
        timestamp: 'e357dca0-9d76-11eb-891f-8742ff5262aa',
        connect_info: {
            imap_account: {
                imap_server: 'imap-mail.outlook.com',
                imap_username: 'conet_user2@outlook.com',
                imap_user_password: 'fkuyalsxtgxtfvtl',
                imap_port_number: 993
            },
            server_folder: '053c5ab5-62cb-4568-8831-3e75d1c1e57a',
            client_folder: '14ba0292-3cf4-4efc-b4c5-9985e83ceb4e'
        },
        next_time_connect: {
            imap_account: {
                imap_server: 'imap-mail.outlook.com',
                imap_username: 'conet_user2@outlook.com',
                imap_user_password: 'fkuyalsxtgxtfvtl',
                imap_port_number: 993
            },
            server_folder_name: 'fbc22692-8463-487a-b7fa-8c7f920e9868'
        }
    }
};
