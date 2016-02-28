
// Angular is not loaded yet...
function load(url, callback) {
	var xhr = new XMLHttpRequest();
	
	xhr.onreadystatechange = function() {
		xhr.readyState === 4 && callback(xhr);
	};
	
	xhr.open('GET', url, true);
	xhr.send('');
};

angular.element(document).ready(function() {
	load('/resources/myself?' + Math.random().toString().substring(2), function(response) {
		if (response.status === 200) {
			// Remove modal and change background color
			document.body.style.backgroundColor = 'white';
			var loader = document.getElementById('load-container');
			loader.parentNode.removeChild(loader);

			// Start angular application
			window.user = JSON.parse(response.responseText);
			angular.bootstrap(document, ['monitool.app']);
		}
		else if (response.status === 401) {
			// Show login buttons
			document.getElementById('login_buttons').style.display = 'block';
		}
		else 
			console.log('Server seems to be down.');
	});
});
