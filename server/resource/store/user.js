"use strict";

var Store = require('./store');

class UserStore extends Store {

	get modelString() { return 'user'; }

	getPartner(username) {
		return this._callView('partners', {key: username}).then(function(data) {
			if (data.rows.length == 0)
				throw new Error('missing');

			return data.rows[0].value;
		});
	}
	
}

module.exports = UserStore;

