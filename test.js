// analytics


ExecuteOrDelayUntilScriptLoaded(runAnalytics, 'sp.js');

function runAnalytics() {
	var context = new SP.ClientContext.get_current();
	var currentUser = context.get_web().get_currentUser()

	clientContext.load(currentUser);

	clientContext.executeQueryAsync(
		function(sender, args) {

			var email = currentUser.get_email();
			var group;

			if (email == 'benevole@medecinsdumonde.net')
				group = 'benevole';
			else if (email == 'adherent@medecinsdumonde.net')
				group = 'adherent';
			else if (/(admin|adminco|advocacy|comoff|coord|fieldco|finco|genco|ladco|lad|log|logco|medco|midwife|monitoring|netco|pm|qualiadv|repoff|regco|representative)[\-\.]/.test(email))
				group = 'terrain_doi';
			else
				group = 'nominatif';


			console.log(email, group);
		},
		function(sender, args) {
		}
	);
}

