/**
 * This script manages
 * - user authentication in monitool
 * - loading the angular application.
 */




/**
 * If user is using IE, return the major version
 * Otherwise, return false.
 *
 * This is used to avoid having users using old IE versions to log in.
 *
 * @see http://stackoverflow.com/a/21712356/1897495
 */
function getInternetExplorerVersion() {
	var ua = window.navigator.userAgent;

	var msie = ua.indexOf('MSIE ');
	if (msie > 0) {
		// IE 10 or older => return version number
		return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
	}

	var trident = ua.indexOf('Trident/');
	if (trident > 0) {
		// IE 11 => return version number
		var rv = ua.indexOf('rv:');
		return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
	}

	var edge = ua.indexOf('Edge/');
	if (edge > 0) {
		// Edge (IE 12+) => return version number
		return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
	}

	// other browser
	return false;
}

/**
 * This handler is called when the Partner login button is clicked
 * It changes the display to show the login/password form.
 */
function onParterLoginClicked(e) {
	// rezize logo_img
	document.getElementById('logo_img').style.width = '190px';

	// hide login screen, show login form
	document.getElementById('login_buttons').style.display = 'none';
	document.getElementById('partner_login').style.display = 'block';
	e.preventDefault();
}

/**
 * This handler is called when the Go back button is clicked in the partner login form.
 * It changes the display to show the default screen.
 */
function onGoBackClicked(e) {
	// rezize logo_img
	document.getElementById('logo_img').style.width = '250px';

	// hide login screen, show login form
	document.getElementById('login_buttons').style.display = 'block';
	document.getElementById('partner_login').style.display = 'none';
	e.preventDefault();
}

/**
 * When this init script is run, the first thing it does it to check if the user
 * already have a valid cookie.
 *
 * This handler is called to either:
 * - Load the application if the user is logged in, but the application is not loaded (production mode).
 * - Start the application if the user is logged in, and the app is loaded (development mode).
 * - Show the login GUI if the cookie is not valid.
 * - Show an error if the server is not reachable.
 */
function onAuthResponse(e) {
	var authReq = e.currentTarget;

	// User is logged on
	if (authReq.status === 200) {
		// Pass fetched user to app by a global
		window.user = JSON.parse(authReq.responseText);

		if (window.monitool) {
			startApplication();
		}
		else {
			// Show loader
			document.getElementById('loader').style.display = 'block';

			// Start loading app
			var appReq = new XMLHttpRequest();
			appReq.addEventListener("progress", onAppProgress, false);
			appReq.addEventListener("load", onAppLoaded, false);
			appReq.open("GET", "/monitool2.js");
			appReq.send();
		}
	}
	// User is not logged on
	else if (authReq.status === 401)
		// show login screen
		document.getElementById('login_buttons').style.display = 'block';
	else
		// show error
		document.getElementById('server_down').style.display = 'block';
}

function onAppProgress(e) {
	// Firefox reports compressed sizes (ex: e.loaded = 120kB, e.total = 1.3MB)
	// Chrome reports uncompressed loaded, but no total (ex: e.loaded = 2.3MB, e.total = 0)
	// IE ? 

	// This hack should work at least for Firefox and Chrome (as long as the bundle size does not change too much).
	var total = e.total || 3634199; 
	document.getElementById('progress').style.width = Math.round(100 * e.loaded / total) + '%';
}

function onAppLoaded(e) {
	var appReq = e.currentTarget;

	// append main script to document.
	var s = document.createElement("script");
	s.innerHTML = appReq.responseText;
	document.body.appendChild(s);

	startApplication();
}

/**
 * Start angular application
 */
function startApplication() {
	// Remove modal and change background color
	document.body.style.backgroundColor = 'white';
	document.body.removeChild(document.getElementById('load-container'));
	document.body.removeChild(document.getElementById('version'));

	// Startup application
	angular.bootstrap(document, ['monitool.app']);
}

function startLoginPage() {
	var ieVersion = getInternetExplorerVersion();

	if (ieVersion !== false && ieVersion < 10) {
		document.getElementById('ie_warning').style.display = 'block';
	}
	else {
		document.getElementById('partner_login_btn').addEventListener('click', onParterLoginClicked, false);
		document.getElementById('go_back_btn').addEventListener('click', onGoBackClicked, false);

		// Send request to see if user is logged in.
		var authReq = new XMLHttpRequest();
		authReq.addEventListener("load", onAuthResponse, false);
		authReq.open('GET', '/resources/myself?' + Math.random().toString().substring(2));
		authReq.send();
	}
}
