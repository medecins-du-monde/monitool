/**
 * This script manages
 * - user authentication in monitool
 * - loading the angular application.
 */
import 'bootstrap/dist/css/bootstrap.css';
import "./app.css";

/**
 * Start loading the application right now
 */
const myApplication = import(
	/* webpackChunkName: "mainapp" */
	'./app'
);


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
function onParterLoginClicked(e, showError) {
	// rezize logo_img, show error msg
	if (showError) {
		document.getElementById('wrong_login').style.display = 'block';
		document.getElementById('logo_img').style.width = '190px';
	}
	else {
		document.getElementById('wrong_login').style.display = 'none';
		document.getElementById('logo_img').style.width = '200px';
	}

	// hide login screen, show login form
	document.getElementById('login_buttons').style.display = 'none';
	document.getElementById('partner_login').style.display = 'block';

	if (e)
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

		// Show loader
		document.getElementById('loader').style.display = 'block';
		let inter = setInterval(onAppProgress, 400);

		// Run the app
		myApplication
			.then(startApplication => {
				inter();

				document.body.style.backgroundColor = 'white';
				document.body.removeChild(document.getElementById('load-container'));
				document.body.removeChild(document.getElementById('version'));

				startApplication();
			})
			.catch(error => 'An error occurred while loading the component');
	}
	// User is not logged on
	else if (authReq.status === 401)
		// show login screen
		document.getElementById('login_buttons').style.display = 'block';
	else
		// show error
		document.getElementById('server_down').style.display = 'block';
}

let progress = 1;
function onAppProgress(e) {
	progress = progress + 0.1 * (100 - progress)

	console.log(progress)
	document.getElementById('progress').style.width = Math.round(progress) + '%';
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
		if (window.location.href.indexOf('failed') !== -1)
			onParterLoginClicked(null, true);

		else {
			var authReq = new XMLHttpRequest();
			authReq.addEventListener("load", onAuthResponse, false);
			authReq.open('GET', '/api/resources/myself?' + Math.random().toString().substring(2));
			authReq.send();
		}
	}
}

function onConfigResponse(e) {
	var configReq = e.currentTarget;

	// User is logged on
	if (configReq.status === 200) {
		// Pass fetched user to app by a global
		window.config = JSON.parse(configReq.responseText);

		document.getElementById('version').innerHTML = 'Version ' + window.config.version;

		let azureLogin = document.getElementById('azure_login');
		if (window.config.azureLabel)
			azureLogin.innerHTML = window.config.azureLabel;
		else
			azureLogin.parentNode.removeChild(azureLogin);

		let trainingLogin = document.getElementById('training_login');
		if (window.config.trainingLabel)
			trainingLogin.querySelector('[type=submit]').value = window.config.trainingLabel;
		else
			trainingLogin.parentNode.removeChild(trainingLogin);

		startLoginPage();
	}
}


var authReq = new XMLHttpRequest();
authReq.addEventListener("load", onConfigResponse, false);
authReq.open('GET', '/api/config?' + Math.random().toString().substring(2));
authReq.send();
