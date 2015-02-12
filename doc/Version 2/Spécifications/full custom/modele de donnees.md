# Modèle de données:

Note Lecteur: "Aggregation" ça veut dire COUNT/SUM/AVG/MEDIAN/..

- Utilisateur

- Projet
	- Metadonnées
	- Contient une liste d'indicateurs à renseigner, la periodicite, et la personne responsable.
	- Contient l´historique de chaque indicateur.

- IndicateurDef
	* Type: Quantitée, pourcentage, boolean.
	* Source
		- visite
			- brut produit d'une saisie sur le terrain (nombre de seringues données, depistage VIH fait).
			- calculé à partir d'autres indicateurs bruts visite ().

		- patient
			- brut produit d'une saisie sur le terrain (poid, taille).
			- calculé à partir d'autres indicateurs bruts patient (IMC).
			- aggregation d'un indicateur de visite (total de seringues données, nombre de seringues moyen par visite, ...)

		- desk/projet/centre
			- brut produit d'une saisie sur le terrain (nombre de seringues données, nombre de bénéficiaires).
			- calculé à partir d'autres indicateurs bruts projet ().
			- aggregation d'un indicateur de visite (nombre de seringues données, ...).
			- aggregation d'un indicateur de patient (poid moyen, IMC moyen, nombre de seringues moyen par patient).




# Comment on stock les saisies??

On a 100k valeurs max, on peut faire n'importe quoi.

Les requetes qu'on va faire
- api.mdm.org/project/[uuid]/stats?filter_
- api.mdm.org/indicator/[uuid]/




- Si on utilise une RDB (pour sommer?)







- Si on utilise une document db avec des map reduce

input:798cd13f-2f3c-423f-123d-f123f12cdf12
{
	indicator: "1234678-1234-1234-1234-1234567890ab",
	from: "isodate",
	to: "isodate",

	
}
