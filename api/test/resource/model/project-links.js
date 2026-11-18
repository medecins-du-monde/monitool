import assert from 'assert';

// The config module exits the process when these are missing.
process.env.MONITOOL_COOKIE_SECRET = process.env.MONITOOL_COOKIE_SECRET || 'test-cookie-secret';
process.env.MONITOOL_AUTH_ADMINISTRATOR = process.env.MONITOOL_AUTH_ADMINISTRATOR || 'test-admin';

describe('Project useful links', function () {
	let Project;

	before(() => {
		Project = require('../../../lib/resource/model/project').default;
	});

	const project = links => Object.assign({
		_id: 'project:624c94fa-9ebc-4f8b-8389-f5959149a0a7',
		type: 'project',
		name: 'test',
		themes: [],
		start: '2020-01-01',
		end: '2020-12-31',
		visibility: 'private',
		active: true,
		entities: [],
		groups: [],
		forms: [],
		crossCutting: {},
		logicalFrames: [],
		users: [],
		extraIndicators: []
	}, links === undefined ? {} : {links});

	const link = (props = {}) => Object.assign({
		id: '0c243e08-8c21-4946-9f5f-ce255106901b',
		title: 'Reference documents',
		url: 'https://mdm.sharepoint.com/sites/project?id=1'
	}, props);

	const invalid = links => assert.throws(() => new Project(project(links)), /invalid_data/);

	it('accepts projects without links', () => {
		new Project(project());
	});

	it('accepts http and https links', () => {
		new Project(project([link(), link({id: '8a7980f8-0e47-49bb-bf54-fdbe2013e3ea', url: 'http://example.org'})]));
	});

	it('rejects non-http urls', () => {
		invalid([link({url: 'javascript:alert(1)'})]);
		invalid([link({url: 'ftp://example.org'})]);
		invalid([link({url: 'example.org'})]);
		invalid([link({url: 'https://exa mple.org'})]);
		invalid([link({url: 'https://'})]);
	});

	it('rejects incomplete or unexpected properties', () => {
		invalid([link({title: ''})]);
		invalid([{id: link().id, url: link().url}]);
		invalid([link({id: 'not-a-uuid'})]);
		invalid([link({extra: true})]);
	});
});
