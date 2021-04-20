import * as request from 'supertest'
import WS from 'ws'
import { inspect } from 'util'

const PORT = 3000
const url = `http://localhost:${ PORT }`

describe ('API Endpoints', () => {

    it ( 'Should successfully connect to root launcher.', done => {
        request( url )
		.get('/')
		.expect( 'Content-Type', /html/ )
        .expect( 200, done )
    })

	it ( "Should pass Online test.",  done => {
		request( url )
		.get( '/testNetwork' )
		.expect( 'Content-Type', /json/ )
		.expect( res => {
			expect( res.body.data.length ).toBe ( 5 )
		})
		.expect ( 200, done )
		
	})

	it ("Should successfully connect to ws server."), done => {
		const wsUrl = `ws://localhost:${ PORT }`
		const ws = WS ( wsUrl )
		ws.once ( 'open', () => {
			ws.send ({ test: 'test' })
		})

		ws.once ( 'message', message => {
			console.log ( inspect ( message, false, 3, true ))
			
		})

		ws.once ('close', () => {
			console.log ( `close`)
		} )
	}

})
