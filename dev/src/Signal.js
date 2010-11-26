
	/**
	 * Signal - custom event broadcaster inpired by Robert Penner's AS3Signals <https://github.com/robertpenner/as3-signals/>
	 * @author Miller Medeiros
	 * @constructor
	 */
	signals.Signal = function(){
		/**
		 * @type Array.<SignalBinding>
		 * @private
		 */
		this._bindings = [];
	};
	
	
	signals.Signal.prototype = {
		
		/**
		 * @type boolean
		 * @private
		 */
		_shouldPropagate : true,
		
		/**
		 * @type boolean
		 * @private
		 */
		_isPaused : false,
		
		/**
		 * @param {Function} listener
		 * @param {boolean} isOnce
		 * @param {Object} scope
		 * @return {signals.SignalBinding}
		 * @private
		 */
		_registerListener : function _registerListener(listener, isOnce, scope){
			var prevIndex = this._indexOfListener(listener),
				binding;
			
			if(prevIndex !== -1){ //avoid creating a new Binding for same listener if already added to list
				binding = this._bindings[prevIndex];
				if(binding.isOnce() !== isOnce){
					throw new Error('You cannot '+ (isOnce? 'add()' : 'addOnce()') +' then '+ (!isOnce? 'add()' : 'addOnce()') +' the same listener without removing the relationship first.');
				}
			} else {
				binding = new signals.SignalBinding(listener, isOnce, scope, this);
				this._bindings.push(binding);
			}
			
			return binding;
		},
		
		/**
		 * @param {Function} listener
		 * @return {int}
		 * @private
		 */
		_indexOfListener : function _indexOfListener(listener){
			var n = this._bindings.length;
			while(n--){
				if(this._bindings[n].listener === listener) return n;
			}
			return -1;
		},
		
		/**
		 * Add a listener to the signal.
		 * @param {Function} listener	Signal handler function.
		 * @param {Object} scope	Context on which listener will be executed (object that should represent the `this` variable inside listener function).
		 * @return {signals.SignalBinding} An Object representing the binding between the Signal and listener.
		 */
		add : function add(listener, scope){
			return this._registerListener(listener, false, scope);
		},
		
		/**
		 * Add listener to the signal that should be removed after first execution (will be executed only once).
		 * @param {Function} listener	Signal handler function.
		 * @param {Object} scope	Context on which listener will be executed (object that should represent the `this` variable inside listener function).
		 * @return {signals.SignalBinding} An Object representing the binding between the Signal and listener.
		 */
		addOnce : function addOnce(listener, scope){
			return this._registerListener(listener, true, scope);
		},
		
		/**
		 * Remove a single listener from the dispatch queue.
		 * @param {Function} listener	Handler function that should be removed.
		 * @return {Function} Listener handler function.
		 */
		remove : function remove(listener){
			var i = this._indexOfListener(listener);
			if(i !== -1){
				this._bindings.splice(i, 1);
			}
			return listener;
		},
		
		/**
		 * Remove all listeners from the Signal.
		 */
		removeAll : function removeAll(){
			this._bindings.length = 0;
		},
		
		/**
		 * @return {uint} Number of listeners attached to the Signal.
		 */
		getNumListeners : function getNumListeners(){
			return this._bindings.length;
		},
		
		/**
		 * Pause Signal, will block dispatch to listeners until `resume()` is called.
		 * @see signals.Signal.prototype.resume
		 */
		pause : function pause(){
			this._isPaused = true;
		},
		
		/**
		 * Resume Signal, enable dispatch to listeners.
		 * @see signals.Signal.prototype.pause
		 */
		resume : function resume(){
			this._isPaused = false;
		},
		
		/**
		 * @return {boolean} If Signal is currently paused and won't broadcast event.
		 */
		isPaused : function isPaused(){
			return this._isPaused;
		},
		
		/**
		 * Stop propagation of the event, blocking the dispatch to next listeners on the queue.
		 * - should be called only during signal dispatch. 
		 */
		stopPropagation : function stopPropagation(){
			this._shouldPropagate = false;
			//TODO: add test to stopPropagation before dispatch
		},
		
		/**
		 * Dispatch Signal to all listeners added to the queue. 
		 * @param {...*} params	Parameters that should be passed to each handler.
		 */
		dispatch : function dispatch(params){
			if(this._isPaused) return;
			
			var paramsArr = Array.prototype.slice.call(arguments),
				bindings = this._bindings.slice(), //clone array in case add/remove items during dispatch
				i = 0,
				cur;
				
			while(cur = bindings[i++]){
				if(cur.execute(paramsArr) === false || !this._shouldPropagate) break; //execute all callbacks until end of the list or until a callback returns `false`
			}
			
			this._shouldPropagate = true;
		},
		
		/**
		 * @return {string} String representation of the object.
		 */
		toString : function toString(){
			return '[Signal isPaused: '+ this._isPaused +' numListeners: '+ this.getNumListeners() +']';
		}
		
	};