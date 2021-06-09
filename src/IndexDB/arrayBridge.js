const writeIndexDBWaitTime = 1000 * 10; //	10 seconds
class ArrayBridge {
    arrayName;
    array = [];
    waitingProcess = null;
    writeProcessing = false;
    constructor(arrayName) {
        this.arrayName = arrayName;
        /**
         * 			open IndexDB get all
         */
    }
    getAll() {
        return this.array;
    }
    cancelWriteProcess() {
        /**
         * 		cancel write
         */
    }
    async writeProcess() {
        if (this.writeProcessing) {
            return;
        }
        this.writeProcessing = true;
        /**
         * 		await write indexDB
         */
        this.writeProcessing = false;
    }
    fireWriteProcess() {
        clearTimeout(this.waitingProcess);
        // if ( this.writeProcessing ) {
        // 	this.cancelWriteProcess ()
        // }
        this.waitingProcess = setTimeout(() => {
            this.waitingProcess();
        }, writeIndexDBWaitTime);
    }
    /**
     *
     * @param object new Data
     */
    push(object) {
        /**
         * 		add order
         */
        this.array.push(object);
        return this.fireWriteProcess();
    }
}
