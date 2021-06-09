
const writeIndexDBWaitTime = 1000 * 10			//	10 seconds

class ArrayBridge {

	public array = []
	private waitingProcess = null
	private writeProcessing = false
	constructor ( private arrayName: string ) {
		/**
		 * 			open IndexDB get all
		 */
	}

	public getAll () {
		return this.array
	}

	private cancelWriteProcess () {
		/**
		 * 		cancel write 
		 */
	}

	private writeProcess () {
		if ( this.writeProcessing ) {
			return
		}
		/**
		 * 		write indexDB
		 */

	}

	private fireWriteProcess () {
		clearTimeout ( this.waitingProcess )
		// if ( this.writeProcessing ) {
		// 	this.cancelWriteProcess ()
		// }
		this.waitingProcess = setTimeout (() => {
			this.waitingProcess ()
		}, writeIndexDBWaitTime )
	}
	/**
	 * 
	 * @param object new Data
	 */
	public push ( object ) {
		/**
		 * 		add order
		 */
		this.array.push ( object )
		return this.fireWriteProcess ()
	}

}