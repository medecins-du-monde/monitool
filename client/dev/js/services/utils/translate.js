"use strict";

angular
	.module('monitool.services.utils.translate', [])

	.service('googleTranslation', function($http) {
		var CONFIG = {
			url: 'https://www.googleapis.com/language/translate/v2',
			method: 'GET',
			params: {
				key: 'AIzaSyAvLe2P4D1GQ5_DfsHeg0E29yJCsRe0_Jw'
			}
		};

		this.translate = function(text, targetLanguage, sourceLanguage) {
			var config = angular.copy(CONFIG);
			config.params.q = text.replace(/\n/g, '<br/>');
			config.params.target = targetLanguage;
			if (sourceLanguage)
				config.params.source = sourceLanguage

			return $http(config).then(function(result) {
				var translation = result.data.data.translations[0].translatedText;

				// restore line breaks
				translation = translation.replace(/ *<br *\/? *> */g, "\n");

				// remove escaped chars
				translation = translation.replace(/&#(\d+);/g, function(_, match) {
					return String.fromCharCode(match);
				});

				return translation;
			});
		};
	});

