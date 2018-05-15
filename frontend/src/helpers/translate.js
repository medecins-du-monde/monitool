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

import axios from 'axios';

/**
 * Allows calling the google translate API to translate strings.
 * A valid API key should be included in the config.json file for the service to work.
 *
 * @example
 * translate('Hello', 'fr', 'en') == Promise.resolve('bonjour')
 * translate('Hello', 'es', 'en') == Promise.resolve('buenos dias')
 *
 * // google translate can guess source language.
 * translate('Hello', 'fr') == Promise.resolve('bonjour')
 */
export default async function translate(text, targetLanguage, sourceLanguage) {
	const params = {
		q: text.replace(/\n/g, '<br/>'),
		key: window.GOOGLE_TRANSLATE_KEY,
		target: targetLanguage
	};

	if (sourceLanguage)
		params.source = sourceLanguage

	const result = await axios.get(
		'https://www.googleapis.com/language/translate/v2',
		{params: params}
	);

	return result.data
		.data.translations[0].translatedText
		// restore line breaks
		.replace(/ *<br *\/? *> */g, "\n")

		// remove escaped chars
		.replace(/&#(\d+);/g, (_, match) => String.fromCharCode(match));
};
