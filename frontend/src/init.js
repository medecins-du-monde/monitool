/**
 * This script manages
 * - user authentication in monitool
 * - loading the angular application.
 */

import axios from 'axios';

import 'bootstrap/dist/css/bootstrap.css';
import "./app.css";


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


let progress = 1;
function onAppProgress(e) {
	progress = progress + 0.1 * (100 - progress);
	document.getElementById('progress').style.width = Math.round(progress) + '%';
}


async function configure() {
	// Fill missing data on page with content of configuration from API
	window.config = (await axios.get('/api/config')).data;

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

	// Configure event listeners, and buttons
	document.getElementById('partner_login_btn').addEventListener('click', onParterLoginClicked, false);
	document.getElementById('go_back_btn').addEventListener('click', onGoBackClicked, false);

	// Show partner login page if we entered a wrong password.
	if (window.location.href.indexOf('failed') !== -1)
		onParterLoginClicked(null, true);
}


async function init() {
	var ieVersion = getInternetExplorerVersion();
	if (ieVersion !== false && ieVersion < 10) {
		document.getElementById('ie_warning').style.display = 'block';
		return;
	}

	try {
		await configure();

		window.user = (await axios.get('/api/resources/myself')).data;

		// Show loader
		document.getElementById('loader').style.display = 'block';
		let inter = setInterval(onAppProgress, 400);

		// Run the app
		const startApplication = await import(
			/* webpackChunkName: "mainapp" */
			'./app'
		);

		clearInterval(inter);

		document.body.style.backgroundColor = 'white';
		document.body.removeChild(document.getElementById('load-container'));
		document.body.removeChild(document.getElementById('version'));

		startApplication.default();
	}
	catch (error) {
		if (error.response) {
			if (error.response.status === 401)
				document.getElementById('login_buttons').style.display = 'block';
			else
				document.getElementById('server_down').style.display = 'block';
		}
		else
			console.log(error)
	}
}

init().catch(console.error);

console.log('coucou')