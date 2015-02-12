A noter que je n'ai pas encore mis d'objectifs!


/user/<uuid>
{
	email: "whatever@whatever.com",
	password: "some_salt_and_hash",
	metadata
}

/user/<uuid>/expected-input
[
	{id: <uuid>, from: "2014-01-01", to: "2014-02-01"}
]

/project/<uuid>
{
	name: "...",
	country: "RDC",
	properties: {

	},
	indicators: {
		<uuid>: {
			type: "planned",
			start_date: "2014-01-01T00:00:00Z",
			end_date: "2014-12-01T00:00:00Z",
			periodicity: "month"
			target: "center"
		},
		<uuid>: {
			type: "ondemand",
			target: "center"
		},
		



	}
}

/center/<uuid>
{
	id: <uuid>,
	project: <uuid>,
	name: "centre de sante de XXX",
	latitude: 20.1231,
	longitude: 10.1231
}



// les indicateurs consultation, patient, centre et projet sont assez differents dans leur methode de calcul, car on ne sait jamais a quel niveau les donnees sont saisies.
// je pense que je vais prendre le parti de dire qu'on se base toujours sur le niveau inferieur et que les formules soient simples quitte à devoir renseigner des indicateurs intermédiaires (dont on aura de toute facon probablement besoin).


A clarifier!
Est-t'il possible d'utiliser un meme indicateur pour un centre et pour un projet?
et pour un beneficiaire?
Dans ce modele non, mais si on bidouille et qu'on met plusieurs formules de calcul par indicateur, on devrait pouvoir s'en sortir.


/indicator/<uuid>
{
	id: <uuid>,
	name: "Taux de satisfaction parmi les beneficiaires",
	type: "project",
	unit: "%",
	computation: {
		type: "percentage",
		numerator: <uuid>,
		denominator: <uuid>
	}
}

{
	id: <uuid>,
	name: "Nombre de beneficiaires satisfaits",
	type: "project",
	unit: "beneficiaires",
	computation: {
		type: "sum",
		indicator: <uuid>
	}
}

{
	id: <uuid>,
	name: "Nombre de beneficiaires satisfaits",
	type: "center",
	unit: "beneficiaires",
	computation: {
		type: "filtered_count",
		indicator: <uuid>,
		test: "equality",
		value: true
	}
}

{
	id: <uuid>,
	name: "Le beneficiaire est-t'il satisfait",
	type: "beneficiary",
	unit: null,
	computation: null
}


// api de stats.
// Reprendre le code legacy de zbo-admin?

Cette sortie est disponible pour les differents logiciels du marché (Excel, EpiInfo, etc).

/project/<uuid>/indicators?from=2010-01-01&to=2020-01-01&filter_gender=male&aggregate[]=year
{
	"2012": {
		<uuid>: 1231,
		<uuid>: 1231,
		<uuid>: 1231,
		<uuid>: 1231,
		<uuid>: 1231,
		<uuid>: 1231,
	},
	"2013": {
		<uuid>: 1231,
		<uuid>: 1231,
		<uuid>: 1231,
		<uuid>: 1231,
		<uuid>: 1231,
		<uuid>: 1231,
	}
}


