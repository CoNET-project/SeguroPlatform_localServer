import { readKey, Message, enums, encrypt, readMessage, generateKey as GenerateKey, decrypt } from 'openpgp'
import type { KeyOptions, KeyPair } from 'openpgp'
import { waterfall } from 'async'
import { v4 } from 'uuid'
import { inspect } from 'util'
import { createHash } from 'crypto'

import { request } from 'http'
import * as WS from 'ws'
import type { RequestOptions } from 'http'
const imapAccountArray =
[
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
]

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
`
const seguroKeyID = 'BC934C7133E2B088'

const generateKey = ( passwd: string, name: string, email: string, CallBack ) => {
	const userId = {
		name: name,
		email: email
	}
	const option: KeyOptions = {
		passphrase: passwd,
		userIds: [ userId ],
		curve: "ed25519",
		aead_protect: false,
		//aead_protect_version: 4
	}

	return GenerateKey ( option )
	
	.then (( data ) => {
		return CallBack ( null, data )
	})
}


const encryptMessage = async ( clearText: string, publicKeyArmored: string, privateKeyArmored: string, CallBack ) => {
	const option = {
		privateKeys: await readKey({ armoredKey: privateKeyArmored }),
		publicKeys: await readKey({ armoredKey: publicKeyArmored }),
		message: await Message.fromText( clearText ),
		compression: enums.compression.zip
	}
	return encrypt ( option ).then ( n => {
		console.log ( inspect ( n, false, 3, true ))
		return CallBack ( null, n )
	})
}

const encrypBySeguroMessage = async ( data: connectRequest_test, CallBack ) => {
	const message: connectRequest_test = JSON.parse ( JSON.stringify ( data ))
	delete message.kloak_private
	delete message.device_private

	const option = {
		privateKeys: await readKey({ armoredKey: data.device_private }),
		publicKeys: await readKey({ armoredKey: seguroKey }),
		message: await Message.fromText( JSON.stringify ( message )),
		compression: enums.compression.zip
	}
	return encrypt ( option ).then ( n => {
		return CallBack ( null, n )
	})
}

const decryptMessage = async ( encryptedMessage: string, privateKey: string, publicKey: string, CallBack ) => {
	const option = {
		privateKeys: await readKey ({ armoredKey: privateKey }),
		publicKeys: await readKey ({ armoredKey: publicKey }),
		message: await readMessage ({ armoredMessage: encryptedMessage })
	}
	return decrypt ( option ).then ( n => {
		return CallBack ( null, n )
	}).catch ( ex => {
		console.log ( inspect ({ decryptMessageError: ex }, false, 3, true ))
		CallBack ( ex )
	})
}

const requestPost = ( postData, urlPath: string, CallBack ) => {
	const PORT = 3000
	const url = `localhost`
	const postString = JSON.stringify ( postData )
	const option: RequestOptions = {
		host: url,
		port: PORT,
		path: urlPath,
		method: 'POST',
		headers: {
			"Content-Type": "application/json",
			'Content-Length': Buffer.byteLength ( postString )
		}
	}
	let _data = ''
	const req = request ( option, res => {
		res.once ( 'error', err => {
			return CallBack ( err )
		})

		res.on ('data', data => {
			_data += data.toString ()
		})

		res.once ( 'end', () => {
			let ret = null
			try {
				ret = JSON.parse ( _data )
			} catch ( ex ) {
				return CallBack ( ex )
			}
			return CallBack ( null, ret )
		})


	})
	req.end ( postString )

}

const requestPostLongConnect = ( postData, urlPath: string, CallBack ) => {
	const PORT = 3000
	const url = `localhost`
	const postString = JSON.stringify ( postData )
	const option: RequestOptions = {
		host: url,
		port: PORT,
		path: urlPath,
		method: 'POST',
		headers: {
			"Content-Type": "application/json",
			'Content-Length': Buffer.byteLength ( postString )
		}
	}
	let _data = ''

	const checkEntry = ( ) => {
		const index = _data.indexOf ('\r\n\r\n')
		if ( index < 0 ) {
			return
		}
		
	}

	const req = request ( option, res => {
		res.once ( 'error', err => {
			return CallBack ( err )
		})

		res.on ('data', data => {
			_data += data.toString ()
			checkEntry ()
		})



		res.once ( 'end', () => {
			let ret = null
			try {
				ret = JSON.parse ( _data )
			} catch ( ex ) {
				return CallBack ( ex )
			}
			return CallBack ( null, ret )
		})


	})
	req.end ( postString )
}

const decryptMessageCheckSeguroKey = async ( encryptedMessage: string, data: connectRequest_test, CallBack ) => {
	const option = {
		privateKeys: await readKey ({ armoredKey: data.device_private }),
		publicKeys: await readKey ({ armoredKey: seguroKey }),
		message: await readMessage ({ armoredMessage: encryptedMessage })
	}

	return decrypt ( option ).then ( n => {
		if ( n.signatures[0].keyid.toHex().toLocaleUpperCase() !== seguroKeyID ) {
			return CallBack ('keyid check error!')
		}
		return CallBack ( null, n.data )
	})
}

export const buildTestAccount = ( CallBack ) => {
	let deviceKey: KeyPair = null
	return waterfall ([
		next => generateKey ( '','','', next ),
		( data, next ) => {
			deviceKey = data
			return generateKey ( '','','', next )
		}
	], ( err, data: KeyPair ) => {
		if ( err ) {
			return CallBack ( err )
		}
		const imapData = imapAccountArray [ 0 ]//Math.round ( Math.random () * 2 ) ]
		const request: connectRequest_test = {
			kloak_account_armor: data.publicKeyArmored,
			kloak_private: data.privateKeyArmored,
			device_private: deviceKey.privateKeyArmored,
			device_armor: deviceKey.publicKeyArmored,
			imap_account: imapData.accounts[0],
			client_folder_name: v4 (),
			use_kloak_shared_imap_account: true,
			server_folder: imapData.server_folder
		}

		return CallBack ( null, request )
	})
}


const wsConnect = ( url: string, sendData, CallBack ) => {
	const ws = new WS ( url )

	ws.on ( 'message', message => {
		let ret = null
		try {
			ret = JSON.parse ( message )
		} catch ( ex ) {
			return console.log (`wsConnect ws.on ( 'message' )  JSON.parse Error`, ex )
		}
		return CallBack ( null, ret )
	})

	ws.once ( 'close', () => {
		console.log ('on close')
	})

	ws.once ( 'open', () => {
		return ws.send ( JSON.stringify ( sendData ))
	})

	return ws
	
}

/**
 * 
 * 			test unit
 */

let requestData: connectRequest_test = null
let hash1 = ''

/*
waterfall ([
	next => buildTestAccount ( next ),							//			Init device and Seguro key, puckup a Seguro public listening channel IMAP
	
	( data, next ) => {
		requestData = data
		return encrypBySeguroMessage ( requestData, next )		//			create IMAP request 
	},
	( data, next ) => {
		requestData.encrypted_request = data
		hash1 = createHash ('sha256').update ( data ).digest ('hex')
		console.time (`requestPost [${ hash1 }]`)
		return requestPost ( requestData, '/getInformationFromSeguro', next ) 		//	post request
	},
	( data: connectRequest_test, next ) => {
		console.timeEnd (`requestPost [${ hash1 }]`)
		hash1 = createHash ('sha256').update ( data.encrypted_response ).digest ('hex')
		return decryptMessageCheckSeguroKey ( requestData.encrypted_response = data.encrypted_response, requestData, next )		//	decrypt response
	},
	
	( data, next ) => {
		let respon: connectRequest_test = null
		try {
			respon = requestData.reponseJson = JSON.parse ( data )
		} catch ( ex ) {
			return next ( ex )
		}
		console.log ( inspect ( requestData, false, 3, true ))
		console.time (`start connect to Seguro [${ hash1 }]`)

		let callbak = false																					//	try connect Seguro use responsed connect_info
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
				
				return setTimeout (() => {											//		close ws connect
					ws.close ()
					return next ()
				}, 2000 )
			}
			
			console.log ( inspect ( data, false, 3, true ))
		})

	},
	
	next => {																						//	post request to next_time_connect
		requestData.imap_account = requestData.reponseJson.next_time_connect.imap_account
		requestData.server_folder = requestData.reponseJson.next_time_connect.server_folder
		console.log ( inspect ({ startToGetConnectDatFromAP: 'Call /getInformationFromSeguro !' }))
		return requestPost ( requestData, '/getInformationFromSeguro', next )						
	},
	( data: connectRequest_test, next ) => {														//	decrypt response
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
		console.log ( inspect ( requestData, false, 3, false ))										//	try connect Seguro use responsed connect_info
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
				
			

				return setTimeout (() => {															//		close ws connect
					ws.close ()
					return next ()
				}, 2000 )
			}
			console.log ( inspect ( data, false, 4, true ))

		})

	}

], ( err, message ) => {
	if ( err ) {
		return console.log ( err )
	}
	console.log ( inspect ( message, false, 3, true ))
})
/** */


/**
 * 
 * 			test unit
 */
let requestData1: connectRequest_test = null
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
					/**
					 * 				send message to device1
					 */
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