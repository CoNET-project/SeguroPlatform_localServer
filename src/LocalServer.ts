import * as express from 'express'
import type { Server } from 'http'
import { Server as WsServer } from 'ws'

import { normalize, join } from 'path'
import * as jszip from 'jszip'
import * as fse from 'fs-extra'
import { imapAccountTest } from './Imap'
import { inspect } from 'util'
import type { imapPeer } from './Imap'
import { testImapServer, getInformationFromSeguro, buildConnect } from './network'
const upload = require ( 'multer' )()

class LocalServer {
    private appsPath = join ( __dirname, 'apps' )
	private localserver: Server = null
    constructor ( private PORT = 3000 ) {
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

    private initialize = async () => {

        const app = express()
		const wsServer = new WsServer ({ noServer: true })
		const wsServerConnect = new WsServer ({ noServer: true })

        app.use ( express.static ( 'static' ))
		const folder = join ( this.appsPath, 'launcher' )
        app.use ( '/', express.static ( folder ))
		app.use ( express.json ())

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
		app.get ( '/testNetwork', ( req, res ) => {
			return testImapServer (( _err, data: any [] ) => {
				return res.json ({ data: data })
			})
		})

		/**
		 * 
		 */
		app.post ( '/getInformationFromSeguro', ( req, res ) => {
			const requestObj: connectRequest_test = req.body
			return getInformationFromSeguro ( requestObj, ( err, data )=> {
				if ( err ) {
					res.sendStatus ( 400 )
					return res.end ()
				}
				return res.json ( data )
			})
			

		})

		wsServerConnect.on ( 'connection', ws => {

			return ws.on ( 'message', message => {

				let kk: connect_imap_reqponse = null
				
				try {
					kk = JSON.parse ( message )
				} catch ( ex ) {
					ws.send ( 'Data error!' )
					return ws.close ()
				}


				const peer: imapPeer = buildConnect ( kk, ( err, data ) => {
					app.post ('uuid')
					if ( err ) {
						ws.send ( JSON.stringify ({ err: err.message }))
						
						return ws.close ()
					}
					return ws.send ( JSON.stringify ( data ))
				})

				ws.on ( 'close', () => {
					return peer.closePeer (() => {
						console.log ( `WS on close`)
					})
					
				})
			})

		})

        this.localserver = app.listen ( this.PORT, () => {
            return console.table([
                { 'Kloak Local Server': `http://localhost:${ this.PORT }, local-path = [${ folder}]` }
            ])
        })

		this.localserver.on ( 'upgrade', ( request, socket, head ) => {
			if ( /\/connectToSeguro/.test ( request.url )) {
				console.log ( )
				return wsServerConnect.handleUpgrade ( request, socket, head, ws => {
					return wsServerConnect.emit ( 'connection', ws, request )
				})
			}
			console.log (`unallowed ${ request.url } `)
			return socket.destroy()
		})
    }
}

export default LocalServer
