/*!
 * This file is part of Monitool.
 *
 * Monitool is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Monitool is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Monitool. If not, see <http://www.gnu.org/licenses/>.
 */

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

