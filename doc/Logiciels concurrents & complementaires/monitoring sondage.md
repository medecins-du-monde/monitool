# Résumé

## OpenEpi

Application en javascript pour faire des calculs d'épidémio.
Ne fonctionne qu'avec des données déjà aggregées.

## Epi Info (Center for Disease Control and Prevention + OMS)

Permet de faire des questionnaires, de saisir soit même toutes les réponses, et d'analyser les résultats.

C'est une appli lourde pour windows seulement.
Le produit est disponible en deux versions, la 3.5.4 et la 7
Les bases qui sortent sont respectivement du Access et des fichiers avec du SQL (???)

Les deux versions ne semblent pas compatibles, la nouvelle propose de faire de la saisie à plusieurs en même temps.
À noter aussi, une version DOS est disponible.

Ça semble très utilisé sur le terrain et en général sur ces formations.


Resultat test de epiinfo7:

On retrouve grosso modo les même fonctionalités que dans les autres programmes.
1. un truc pour créer des formulaires
2. un truc pour saisir des données 
3. un truc pour générer des jolis rapports avec des charts, et un truc pour faire des plans.

Premiere impression:
On devrait pouvoir importer facilement les données qui viennent de sphinx en passant par un CSV et les analyser là dedans.
Regarder si possible de fermer le problème de Niklas avec EpiInfo.
Je vois que ça supporte des bases de données, des trucs avec des tables, des clefs externes etc...

Deuxième impression:
C'est obligé qu'on peut fermer le problème avec EpiInfo, et générer des jolis reports sur les missions.
Ça permet de générer des cartes.


## Sphinx et Eureka

Permet de faire des sondages et de remonter les données.

Au choix:
- Terrain online, 
- Terrain offline qui utilise eureka ou sphinx, saisissent et upload.
Pour merger differents centres rien n'est prévu.
Rien non plus pour retrouver des données saisies dans le passé etc...

Analyse, on retrouve les fonctionalitées de base des tableurs.
Rien de plus, rien de moins (pivot table, chart).
L'interface d'analyse est trash par contre.

Aucune fonction de mapping.


## ActivityInfo (Be Data Driven)

Initialement développé en 2009 pour l'UNICEF en RDC

Designed with UNICEF to work at a country, cluster, program, or project level, ActivityInfo allows managers to centralize data collection, track key performance indicators, and provides a single, unified view for all stakeholders.

ActivityInfo provides tools like simple data entry, beautiful maps, summary tables, and standardized reports, to let you coordinate, manage and improve operations.

Il y a 2 contributeurs actifs (3-4 en tout)
- akbertran est un de cofounder de BeDataDriven http://www.bedatadriven.com/#who-we-are
- yuriyz je sais pas

C'est basé sur google apps engine.

A noter que activity info utilise une solution qui s'appelle "Open Data Kit's Collect" pour faire la saisie.
Activity info est un backend possible. D'autres backends: ODK Aggregate ou FormHub.
http://opendatakit.org/

En gros c'est un standard d'échange pour collecter des formulaires

je suis tombé sur le site d'un projet de l'unicef qui s'en sert.
http://www.rrmp.org/

À ce que je vois, ça a l'air de marcher avec une API rest JSON sur le serveur, à voir côté client.

À noter aussi, d'après les slides de présentation du logiciel, il parraitrait qu'on s'en serve deja....

Avantages:
- Le système de saisie. Plutôt que de bricoler un truc ils se sont appuyés sur des standards. On doit pouvoir rajouter des méthodes de saisies facilement.
- Github! on peut faire des pull requests, il y a un bug tracker moderne etc...
- L'exploitaion des données est très facile (pivot table - charts - maps).
- C'est du google apps engine PaaS. On peut:
	- Héberger nous même avec appscale si on veut galérer avec l'install et les mises à jours
	- Déployer sur GAE. C'est pas impossible qu'on se maintiennent sous le free-tier et que ça soit gratos, mais on devra faire les mises à jours nous même.
	- Payer be data driven pour nous créer des comptes sur leurs instances GAE, et les laisser se débrouiller.

Problème:
- L'interface pour importer du excel à pas l'air de marcher.
- GWT, techno mourante.
- Pas de données par jour/semaine/trimestre autrement qu'en réalisant des saisies ponctuelles.
- Je suis pas sûr qu'ils aient réussit à récupérer tous les systèmes de division administratives du monde. Quand j'appelle l'API sur la france, ça donne pas ce que j'attend. Ça peut être un problème pour aggréger les données.
- Ya les tokens de récupération de mot de passe qui sont dispo en clair dans le sqlite locale quand on passe en mode offline. Je pense que je peux changer le mot de passe de leur admin et me logguer sur son compte. J'ai pas essayé depuis l'IP de MDM, mais niveau sécu ça à l'air bof => Faut que je regarde les sources.
- Le mode offline et la detection de la version sur firefox ont l'air franchement fragiles => Se limiter à chrome
	- À voir si je peux pas packager le truc dans un node-webkit pour sortir du browser, et fermer le dossier.

Liens:
- https://about.activityinfo.org/
- https://github.com/bedatadriven/activityinfo
- https://github.com/UNICEFLebanonInnovation/ActvityInfoPython
- https://github.com/bedatadriven/activityinfo-R/tree/master/R


## OpenDataKit (http://opendatakit.org)

Fait par University of Washington.

OpenDataKit is a set of tools to collect, aggregate and author forms to collect data.

Tout est sur des protocoles ouverts (voir OpenRosa / JavaRosa).
Par contre les standards utilisés sont lourds (XML-XSLT-Java...)

Apps: 
- ODK Build: Graphical form building tool
- XLSForm: Tool used to write bigger forms from an xls file.
- ODK Collect: Android app to collect data.
- ODK Aggregate: Repository of data + forms and analysis interface.

Other apps:
- ODK Briefcase: move data between devices/servers.
- ODK Clinic: access/update medical records.
- Tables: update/curate previously collected data.
- Diagnostics: reads rapid diagnostic tests.
- Scan: translate paper forms to digital data.
- Sensors: connects external sensors to devices.

Companies that build software over ODK:
- Nafundi: Entreprise derriere ODK, et très orientée ONG en fait. Rien de techniquement sérieux sur leur site
- Dimagi: Très ONG aussi. Vendent leur service pour aider à remonter les données du terrain avec des applis mobiles, SMS etc. 
- Mindflow: pas reussit à trouver.
- Mega Six: Vendent une version custom de ODK, mains inspirent pas confiance.
- Seeing Swans: idem.
- ++ 20 more (?)


## FormHub

Service sur cloud qui permet 
Clean, sur github, et bien formalisé.
On peut le brancher à ce qu'on veut.

Je sais pas ce que vaut l'analyse.


## Enketo

Encore un service de sondage offline sur le net.
https://enketo.org/

Compatible aussi avec les autres.

Je sais pas ce que vaut l'analyse.


## Kobo Toolbox

Encore un fork de ODK.

Ils ont une suite complete comme ODK




<table>
	<tr>
		<td>Logiciel</td>
		<td colspan="5">Saisie</td>
		<td>Stockage centralisé</td>
		<td>Aggregation</td>
		<td colspan="4">Analyse</td>
	</tr>
	<tr>
		<td></td>
		<td>Web</td>
		<td>Mobile</td>
		<td>PC offline</td>
		<td>Mobile offline</td>
		<td>Papier</td>
		<td></td>
		<td></td>
		<td>Épidémio</td>
		<td>Maps</td>
		<td>Charts</td>
		<td>Pivot table</td>
	</tr>
	<tr>
		<td>EpiInfo</td>

		<td>non</td>
		<td>non</td>
		<td>1 poste</td>
		<td>non</td>
		<td>non</td>

		<td>Serveur SQL</td>

		<td>oui?</td>
		
		<td>oui</td>
		<td>oui</td>
		<td>oui</td>
		<td>oui</td>
	</tr>
	<tr>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
		<td></td>
	</tr>

</table>

