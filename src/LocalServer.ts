// import * as express from 'express'
// import type { Server } from 'http'
// import { Server as WsServer } from 'ws'
// import { readKey, readMessage, Message, enums, encrypt } from 'openpgp'
// import { normalize, join } from 'path'
// import * as jszip from 'jszip'
// import * as fse from 'fs-extra'
// import { imapAccountTest } from './Imap'
// import { inspect } from 'util'
// import type { imapPeer } from './imapPeer'
// import { testImapServer, getInformationFromSeguro, buildConnect } from './network'
// const upload = require ( 'multer' )()
// const cors = require('cors')
// import { each } from 'async'
// const testDomainName = ['yahoo.com','microsoft.com','taobao.com','adobe.com']
// const getEncryptedMessagePublicKeyID = async ( encryptedMessage: string, CallBack ) => {
//     const encryptObj = await readMessage({ armoredMessage: encryptedMessage })
//     return CallBack ( null, encryptObj.getEncryptionKeyIds().map ( n => n.toHex().toUpperCase()))
// }
//
//
// class LocalServer {
//     private localserver: Server = null
//
//     private connect_peer_pool: any [] = []
//     constructor ( private PORT = 3000, private appsPath: string = join ( __dirname, 'apps' ) ) {
//         this.initialize()
//     }
//
//     private unzipApplication = async ( buffer: Buffer ) => {
//         return jszip
//             .loadAsync(buffer)
//             .then(( zip ) => {
//                 return zip.forEach ( async ( relativePath, file ) => {
//                     if ( file.dir ) {
//                         const dirPath = normalize (
//                             this.appsPath + relativePath
//                         )
//                         try {
//                             return await fse.mkdir ( dirPath )
//                         } catch ( err ) {
//                             return
//                         }
//                     }
//
//                     return file.async('nodebuffer').then ( async (data) => {
//                         const filePath = normalize(
//                             this.appsPath + relativePath
//                         )
//                         await fse.writeFile (filePath, data )
//                     })
//
//                 })
//             })
//             .catch ( err => {
//                 throw err
//             })
//     }
//
//     public end () {
//         this.localserver.close ()
//     }
//
//     public postMessageToLocalDevice ( device: string, encryptedMessage: string ) {
//         const index = this.connect_peer_pool.findIndex ( n => n.publicKeyID === device )
//         if ( index < 0 ) {
//             return console.log ( inspect ({ postMessageToLocalDeviceError: `this.connect_peer_pool have no publicKeyID [${ device }]`}, false, 3, true ))
//         }
//         const ws = this.connect_peer_pool[ index ]
//         const sendData = { encryptedMessage: encryptedMessage }
//         console.log ( inspect ({ ws_send: sendData}, false, 3, true ))
//         return ws.send ( JSON.stringify ( sendData ))
//     }
//
//     private initialize = async () => {
//
//         const app = express()
//
//         const wsServerConnect = new WsServer ({ noServer: true })
//
//         app.use ( express.static ( 'static' ))
//         const folder = join ( this.appsPath, 'launcher' )
//         app.use(cors());
//         app.use ( '/', express.static ( folder ))
//         app.use ( express.json ())
//
//         app.once ( 'error', ( err: any ) => {
//             console.log ( err )
//             return process.exit (1)
//         })
//
//         app.get('/', async (req: express.Request, res: express.Response) => {
//             // res.sendStatus(200)
//             console.log(this.appsPath)
//             const launcherHTMLPath = join(
//                 this.appsPath  + '/launcher' + '/index.html'
//             );
//             const hasLauncher = await fse.pathExists(launcherHTMLPath);
//             console.log (launcherHTMLPath)
//             if (hasLauncher) {
//                 return res.status(200).sendFile(launcherHTMLPath);
//             }
//             return res.status(200).send("<p style='font-family: Arial, Helvetica, sans-serif;'>Oh no! You don't have the Kloak Platform Launcher!</p>")
//         });
//
//         app.post ( '/update', upload.single ( 'app_data' ),
//             ( req: express.Request, res: express.Response ) => {
//                 const { app_id } = req.body
//                 const { file } = req
//                 if ( file.mimetype !== 'application/zip' ) {
//                     res.sendStatus ( 400 )
//                     return res.end()
//                 }
//
//                 const rootFolder = normalize ( this.appsPath + '/' + app_id )
//                 fse.remove( rootFolder, ( err: any ) => {
//                     if ( err ) {
//                         return res.sendStatus(400)
//                     }
//                     this.unzipApplication( file.buffer )
//                         .then(() => {
//                             res.sendStatus(200)
//                         })
//                         .catch((err) => {
//                             res.sendStatus(400)
//                         })
//                 })
//             }
//         )
//
//         app.post ( '/testImap', ( req: express.Request, res: express.Response ) => {
//             const { body } = req
//             if (
//                 !body.imapServer ||
//                 !body.imapUserName ||
//                 !body.imapUserPassword ||
//                 !body.imapPortNumber
//             ) {
//                 res.sendStatus ( 400 )
//                 return res.end()
//             }
//
//             return imapAccountTest ( body, ( err: any ) => {
//                 if ( err ) {
//                     res.sendStatus ( 400 )
//                     return res.end()
//                 }
//                 res.sendStatus (200)
//                 return res.end()
//             });
//         })
//
//         /**
//          * Test network online
//          *
//          * Test results Array for imap.gmail.com, imap.mail.yahoo.com, imap.mail.me.com, outlook.office365.com,imap.zoho.com
//          * test connecting with tls 993 port
//          * {
//          * 		name: server name
//          * 		err: Error | null if have not error
//          * 		time: connected time | null if have error
//          * }
//          */
//         app.get ( '/testImapServer', ( req, res ) => {
//             return testImapServer (( _err, data: any [] ) => {
//                 console.log('Testing IMAP server')
//                 data.map(res => {
//                     console.log(res)
//                 })
//                 return res.json ({ data: data })
//             })
//         })
//
//         /**
//          * 			Get IMAP account
//          */
//         app.post ( '/getInformationFromSeguro', ( req, res ) => {
//             const requestObj: connectRequest = req.body
//             return getInformationFromSeguro ( requestObj, ( err, data )=> {
//                 if ( err ) {
//                     res.sendStatus ( 400 )
//                     return res.end ()
//                 }
//                 return res.json ( data )
//             })
//
//         })
//
//         /**
//          *
//          */
//         app.post ( '/postMessage', ( req, res ) => {
//             const post_data: postData = req.body
//             console.log ( inspect( { 'localhost:3000/postMessage' : post_data }, false, 2, true ))
//             if ( post_data.connectUUID ) {
//                 if ( !post_data.encryptedMessage ) {
//                     console.log ( inspect ({ postMessage_ERROR_Have_not_encryptedMessage: post_data }, false, 3, true ))
//                     res.sendStatus ( 404 )
//                     return res.end ()
//                 }
//                 const index = this.connect_peer_pool.findIndex ( n => n.serialID === post_data.connectUUID )
//                 if ( index < 0 ) {
//                     console.log ( inspect ({ postMessage_ERROR_Have_not_connectUUID: post_data }, false, 3, true ))
//                     res.sendStatus ( 404 )
//                     return res.end ()
//                 }
//                 const ws = this.connect_peer_pool [ index ]
//
//
//                 return ws.AppendWImap1 ( post_data.encryptedMessage, '', err => {
//                     if ( err ) {
//                         res.sendStatus ( 500 )
//                         return res.end ()
//                     }
//                     res.end ()
//                 })
//
//             }
//
//
//             if ( post_data.encryptedMessage ) {
//
//                 return getEncryptedMessagePublicKeyID ( post_data.encryptedMessage, ( err, keys: string[] ) => {
//
//                     if ( !keys || !keys.length ) {
//                         console.log ( inspect ({ postMessage_ERROR_have_not_device_key_infomation: post_data }, false, 3, true ))
//                         res.sendStatus ( 500 )
//                         return res.end ()
//                     }
//                     console.log ( inspect ( { getEncryptedMessagePublicKeyID: keys }, false, 3, true ))
//                     keys.forEach ( n => {
//                         this.postMessageToLocalDevice ( n, post_data.encryptedMessage )
//                     })
//                     res.end ()
//                 })
//
//             }
//
//             /**
//              * 			unknow type of ws
//              */
//
//             console.log ( inspect ( post_data, false, 3, true ))
//             console.log (`unknow type of ${ post_data }`)
//             res.sendStatus ( 404 )
//             return res.end ()
//         })
//
//
//         wsServerConnect.on ( 'connection', ws => {
//
//             ws.on ( 'message', message => {
//
//                 let kk: connect_imap_reqponse = null
//
//                 try {
//                     if (typeof message === "string") {
//                         kk = JSON.parse(message)
//                     }
//                 } catch ( ex ) {
//                     ws.send ( JSON.stringify ({ status: `Data format error! [${ message }]` }) )
//                     return ws.close ()
//                 }
//
//                 let peer: imapPeer = buildConnect ( kk, ( err, data ) => {
//
//                     if ( err ) {
//                         ws.send ( JSON.stringify ({ status: err.message }))
//                         return ws.close ()
//                     }
//
//                     return ws.send ( JSON.stringify ( data ))
//                 })
//
//                 const serialID = peer.serialID
//
//                 this.connect_peer_pool.push ( peer )
//
//                 ws.once ( 'close', () => {
//                     return peer.closePeer (() => {
//                         const index = this.connect_peer_pool.findIndex ( n => n.serialID === serialID )
//                         if ( index > -1 ) {
//                             this.connect_peer_pool.splice ( index, 1 )
//                         }
//
//                         peer = null
//                         console.log ( `WS [${ serialID }] on close` )
//                     })
//
//                 })
//
//                 peer.once ('pingTimeOut', () => {
//                     ws.send ( JSON.stringify ({ status: 'pingTimeOut' }))
//                     return ws.close ()
//
//                 })
//
//             })
//
//         })
//
//         wsServerConnect.on ( 'peerToPeerConnecting', ws => {
//             console.log (`wsServerConnect on peerToPeerConnecting`)
//             return ws.on ( 'message', async message => {
//
//                 let kk: connectRequest = null
//
//                 try {
//                     kk = JSON.parse ( message )
//                 } catch ( ex ) {
//                     ws.send ( JSON.stringify ({ status: `Data format error! [${ message }]` }) )
//                     return ws.close ()
//                 }
//
//                 const key = await readKey ({ armoredKey: kk.device_armor })
//                 const device = key.getKeyIds()[1].toHex ().toUpperCase ()
//                 if ( !device ) {
//                     const sendData = { status: `Error: device_armor have not subkey!`, key_ids: `${ key.getKeyIds().map ( n => n.toHex().toUpperCase()) }` }
//                     ws.send ( JSON.stringify ( sendData ) )
//                     console.log ( inspect ( sendData, false, 3, true  ))
//                     return ws.close ()
//                 }
//
//                 ws.publicKeyID = device
//                 this.connect_peer_pool.push ( ws )
//                 const sendData  = { key_ids: `${ key.getKeyIds().map ( n => n.toHex().toUpperCase()) }`}
//                 ws.send ( JSON.stringify (  sendData ))
//                 console.log ( inspect ( sendData, false , 3, true ))
//
//                 ws.once ( 'close', () => {
//
//                     const index = this.connect_peer_pool.findIndex ( n => n.publicKeyID === device )
//                     if ( index > -1 ) {
//                         this.connect_peer_pool.splice ( index, 1 )
//                     }
//                     console.log ( `WS [${ device }] on close` )
//                 })
//             })
//
//         })
//
//         this.localserver = app.listen ( this.PORT, 'localhost', () => {
//             return console.table([
//                 { 'Kloak Local Server': `http://localhost:${ this.PORT }, local-path = [${ folder}]` }
//             ])
//         })
//
//         this.localserver.on ( 'upgrade', ( request, socket, head ) => {
//             if ( /\/connectToSeguro/.test ( request.url )) {
//                 return wsServerConnect.handleUpgrade ( request, socket, head, ws => {
//                     return wsServerConnect.emit ( 'connection', ws, request )
//                 })
//             }
//             if ( /\/peerToPeerConnecting/.test ( request.url )) {
//                 return wsServerConnect.handleUpgrade ( request, socket, head, ws => {
//                     return wsServerConnect.emit ( 'peerToPeerConnecting', ws, request )
//                 })
//             }
//             console.log (`unallowed ${ request.url } `)
//             return socket.destroy()
//         })
//     }
// }
//
// export default LocalServer

import * as express from 'express'
import type { Server } from 'http'
import { resolve } from 'dns'
import { Server as WsServer } from 'ws'
import { readKey, readMessage, Message, enums, encrypt } from 'openpgp'
import { normalize, join } from 'path'
import * as jszip from 'jszip'
import * as fse from 'fs-extra'
import { imapAccountTest } from './Imap'
import { inspect } from 'util'
import type { imapPeer } from './imapPeer'
import { testImapServer, getInformationFromSeguro, buildConnect } from './network'
const upload = require ( 'multer' )()
const cors = require('cors')
const testDomainName = ['yahoo.com','microsoft.com','taobao.com','adobe.com']

const getEncryptedMessagePublicKeyID = async ( encryptedMessage: string, CallBack ) => {
    const encryptObj = await readMessage({ armoredMessage: encryptedMessage })
    return CallBack ( null, encryptObj.getEncryptionKeyIDs().map ( n => n.toHex().toUpperCase()))
}


class LocalServer {
    private localserver: Server = null

    private connect_peer_pool: any [] = []
    constructor ( private PORT = 3000, private appsPath: string = join ( __dirname, 'apps' ) ) {
        this.initialize()
    }

    private unzipApplication = async ( buffer: Buffer ) => {
        return jszip
            .loadAsync(buffer)
            .then(( zip ) => {
                return zip.forEach ( async ( relativePath, file ) => {
                    if ( file.dir ) {
                        const dirPath = normalize (
                            this.appsPath + relativePath
                        )
                        try {
                            return await fse.mkdir ( dirPath )
                        } catch ( err ) {
                            return
                        }
                    }

                    return file.async('nodebuffer').then ( async (data) => {
                        const filePath = normalize(
                            this.appsPath + relativePath
                        )
                        await fse.writeFile (filePath, data )
                    })

                })
            })
            .catch ( err => {
                throw err
            })
    }

    public end () {
        this.localserver.close ()
    }

    public postMessageToLocalDevice ( device: string, encryptedMessage: string ) {
        const index = this.connect_peer_pool.findIndex ( n => n.publicKeyID === device )
        if ( index < 0 ) {
            return console.log ( inspect ({ postMessageToLocalDeviceError: `this.connect_peer_pool have no publicKeyID [${ device }]`}, false, 3, true ))
        }
        const ws = this.connect_peer_pool[ index ]
        const sendData = { encryptedMessage: encryptedMessage }
        console.log ( inspect ({ ws_send: sendData}, false, 3, true ))
        return ws.send ( JSON.stringify ( sendData ))
    }

    private initialize = async () => {

        const app = express()

        const wsServerConnect = new WsServer ({ noServer: true })

        app.use ( express.static ( 'static' ))
        const folder = join ( this.appsPath, 'launcher' )
        app.use(cors());
        app.use ( '/', express.static ( folder ))
        app.use ( express.json ())

        app.once ( 'error', ( err: any ) => {
            console.log ( err )
            return process.exit (1)
        })

        app.get('/', async (req: express.Request, res: express.Response) => {
            // res.sendStatus(200)
            console.log(this.appsPath)
            const launcherHTMLPath = join(
                this.appsPath  + '/launcher' + '/index.html'
            );
            const hasLauncher = await fse.pathExists(launcherHTMLPath);
            console.log (launcherHTMLPath)
            if (hasLauncher) {
                return res.status(200).sendFile(launcherHTMLPath);
            }
            return res.status(200).send("<p style='font-family: Arial, Helvetica, sans-serif;'>Oh no! You don't have the Kloak Platform Launcher!</p>")
        });

        app.once ( 'error', ( err: any ) => {
            console.log ( err )
            return process.exit (1)
        })

        app.post ( '/update', upload.single ( 'app_data' ),
            ( req: express.Request, res: express.Response ) => {
                const { app_id } = req.body
                const { file } = req
                if ( file.mimetype !== 'application/zip' ) {
                    res.sendStatus ( 400 )
                    return res.end()
                }

                const rootFolder = normalize ( this.appsPath + '/' + app_id )
                fse.remove( rootFolder, ( err: any ) => {
                    if ( err ) {
                        return res.sendStatus(400)
                    }
                    this.unzipApplication( file.buffer )
                        .then(() => {
                            res.sendStatus(200)
                        })
                        .catch((err) => {
                            res.sendStatus(400)
                        })
                })
            }
        )

        app.post ( '/testImap', ( req: express.Request, res: express.Response ) => {
            const { body } = req
            if (
                !body.imapServer ||
                !body.imapUserName ||
                !body.imapUserPassword ||
                !body.imapPortNumber
            ) {
                res.sendStatus ( 400 )
                return res.end()
            }

            return imapAccountTest ( body, ( err: any ) => {
                if ( err ) {
                    res.sendStatus ( 400 )
                    return res.end()
                }
                res.sendStatus (200)
                return res.end()
            });
        })

        /**
         * Test network online
         *
         * Test results Array for imap.gmail.com, imap.mail.yahoo.com, imap.mail.me.com, outlook.office365.com,imap.zoho.com
         * test connecting with tls 993 port
         * {
         * 		name: server name
         * 		err: Error | null if have not error
         * 		time: connected time | null if have error
         * }
         */
        app.get ( '/testImapServer', ( req, res ) => {
            return testImapServer (( _err, data: any [] ) => {
                return res.json ({ data: data })
            })
        })

        /**
         * 			Get IMAP account
         */
        app.post ( '/getInformationFromSeguro', ( req, res ) => {
            const requestObj: connectRequest = req.body
            console.log ( inspect ( requestObj, false, 3, true ))
            return getInformationFromSeguro ( requestObj, ( err, data )=> {
                if ( err ) {
                    console.log ( inspect ({getInformationFromSeguro_ERROR: err }, false, 3, true ))
                    if ( res.writable ) {
                        const _err = err.message

                        if ( /Listening/i.test ( _err )) {
                            console.log ( inspect ({ getInformationFromSeguro_ERROR: `res.sendStatus( 408 ).end ()` }, false, 3, true ))
                            return res.sendStatus ( 408 ).end ()
                        }


                        if ( /reach email/i.test ( _err )) {
                            console.log ( inspect ({ getInformationFromSeguro_ERROR: `res.sendStatus( 503 ).end ()` }, false, 3, true ))
                            return res.sendStatus ( 503 ).end ()
                        }
                        console.log ( inspect ({ getInformationFromSeguro_ERROR: `res.sendStatus( 400 ).end ()` }, false, 3, true ))
                        return res.sendStatus ( 400 ).end ()
                    }
                    return
                }
                return res.json ( data )
            })

        })

        /**
         *
         */
        app.post ( '/postMessage', ( req, res ) => {
            const post_data: postData = req.body
            console.log ( inspect( { 'localhost:3000/postMessage' : post_data }, false, 2, true ))
            if ( post_data.connectUUID ) {
                if ( !post_data.encryptedMessage ) {
                    console.log ( inspect ({ postMessage_ERROR_Have_not_encryptedMessage: post_data }, false, 3, true ))
                    res.sendStatus ( 404 )
                    return res.end ()
                }
                const index = this.connect_peer_pool.findIndex ( n => n.serialID === post_data.connectUUID )
                if ( index < 0 ) {
                    console.log ( inspect ({ postMessage_ERROR_Have_not_connectUUID: post_data }, false, 3, true ))
                    res.sendStatus ( 404 )
                    return res.end ()
                }
                const ws = this.connect_peer_pool [ index ]


                return ws.AppendWithOutCreateFolder ( post_data.encryptedMessage, '', err => {
                    if ( err ) {
                        res.sendStatus ( 500 )
                        return res.end ()
                    }
                    res.end ()
                })

            }


            if ( post_data.encryptedMessage ) {

                return getEncryptedMessagePublicKeyID ( post_data.encryptedMessage, ( err, keys: string[] ) => {

                    if ( !keys || !keys.length ) {
                        console.log ( inspect ({ postMessage_ERROR_have_not_device_key_infomation: post_data }, false, 3, true ))
                        res.sendStatus ( 500 )
                        return res.end ()
                    }
                    console.log ( inspect ( { getEncryptedMessagePublicKeyID: keys }, false, 3, true ))
                    keys.forEach ( n => {
                        this.postMessageToLocalDevice ( n, post_data.encryptedMessage )
                    })
                    res.end ()
                })

            }

            /**
             * 			unknow type of ws
             */

            console.log ( inspect ( post_data, false, 3, true ))
            console.log (`unknow type of ${ post_data }`)
            res.sendStatus ( 404 )
            return res.end ()
        })

        wsServerConnect.on ( 'connection', ws => {

            ws.on ( 'message', message => {

                let kk: connect_imap_reqponse = null

                try {
                    // @ts-ignore
                    kk = JSON.parse ( message )
                } catch ( ex ) {
                    ws.send ( JSON.stringify ({ status: `Data format error! [${ message }]` }) )
                    return ws.close ()
                }

                let peer: imapPeer = buildConnect ( kk, ( err, data ) => {

                    if ( err ) {
                        ws.send ( JSON.stringify ({ status: err.message }))
                        return ws.close ()
                    }

                    return ws.send ( JSON.stringify ( data ))
                })

                const serialID = peer.serialID

                this.connect_peer_pool.push ( peer )

                ws.once ( 'close', () => {

                    return peer.closePeer (() => {
                        const index = this.connect_peer_pool.findIndex ( n => n.serialID === serialID )
                        if ( index > -1 ) {
                            this.connect_peer_pool.splice ( index, 1 )
                        }

                        peer = null
                        console.log ( `WS [${ serialID }] on close` )
                    })

                })

                peer.once ( 'pingTimeOut', () => {
                    ws.send ( JSON.stringify ({ status: 'pingTimeOut' }))
                    return ws.close ()

                })

            })

        })

        wsServerConnect.on ( 'peerToPeerConnecting', ws => {
            console.log (`wsServerConnect on peerToPeerConnecting`)
            return ws.on ( 'message', async message => {

                let kk: connectRequest = null

                try {
                    kk = JSON.parse ( message )
                } catch ( ex ) {
                    ws.send ( JSON.stringify ({ status: `Data format error! [${ message }]` }) )
                    return ws.close ()
                }

                const key = await readKey ({ armoredKey: kk.device_armor })
                const device = key.getKeyIDs()[1].toHex ().toUpperCase ()
                if ( !device ) {
                    const sendData = { status: `Error: device_armor have not subkey!`, key_ids: `${ key.getKeyIDs().map ( n => n.toHex().toUpperCase()) }` }
                    ws.send ( JSON.stringify ( sendData ) )
                    console.log ( inspect ( sendData, false, 3, true  ))
                    return ws.close ()
                }

                ws.publicKeyID = device
                this.connect_peer_pool.push ( ws )
                const sendData  = { key_ids: `${ key.getKeyIDs().map ( n => n.toHex().toUpperCase()) }`}
                ws.send ( JSON.stringify (  sendData ))
                console.log ( inspect ( sendData, false , 3, true ))

                ws.once ( 'close', () => {

                    const index = this.connect_peer_pool.findIndex ( n => n.publicKeyID === device )
                    if ( index > -1 ) {
                        this.connect_peer_pool.splice ( index, 1 )
                    }
                    console.log ( `WS [${ device }] on close` )
                })
            })

        })

        this.localserver = app.listen ( this.PORT, 'localhost', () => {
            return console.table([
                { 'Kloak Local Server': `http://localhost:${ this.PORT }, local-path = [${ folder}]` }
            ])
        })

        this.localserver.on ( 'upgrade', ( request, socket, head ) => {
            if ( /\/connectToSeguro/.test ( request.url )) {
                return wsServerConnect.handleUpgrade ( request, socket, head, ws => {
                    return wsServerConnect.emit ( 'connection', ws, request )
                })
            }
            if ( /\/peerToPeerConnecting/.test ( request.url )) {
                return wsServerConnect.handleUpgrade ( request, socket, head, ws => {
                    return wsServerConnect.emit ( 'peerToPeerConnecting', ws, request )
                })
            }
            console.log (`unallowed ${ request.url } `)
            return socket.destroy()
        })


    }
}

export default LocalServer
