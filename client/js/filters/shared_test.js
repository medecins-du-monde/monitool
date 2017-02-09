describe('shared filters', function() {

	var $filter;

	beforeEach(module('monitool.filters.shared'));
	beforeEach(inject(function(_$filter_){
		$filter = _$filter_;
	}));

	it('join should work', function() {
		var join = $filter('join');

		expect(join(['a', 'b'], '')).toEqual('ab');
		expect(join(['a', 'b'], ',')).toEqual('a,b');
	});

	it('pluck should work', function() {
		var pluck = $filter('pluck');

		expect(pluck([{id: 3}], 'id')).toEqual([3]);
		expect(pluck([], 'id')).toEqual([]);
		expect(pluck([{}], 'id')).toEqual(['']);
	});

	it('getObjects should work', function() {
		var getObjects = $filter('getObjects');
		
		expect(getObjects([3], [{id: 3}, {id: 4}])).toEqual([{id: 3}]);
	});

	it('nl2br should work', function() {
		var nl2br = $filter('nl2br');

		expect(nl2br("\n")).toEqual('<br/>');
		expect(nl2br("\nabc\n")).toEqual('<br/>abc<br/>');
		expect(nl2br("\n\nabc\n")).toEqual('<br/><br/>abc<br/>');
	});

});
