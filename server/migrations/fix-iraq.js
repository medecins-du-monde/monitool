"use strict";

var nano = require('nano');

var old = nano('http://rgilliotte:33h7hwe9@monitool-couch.cloudapp.net:5984').use('monitool_new');
// var old = nano('http://localhost:5984').use('monitool-prod-iraq');

old.list({include_docs: true}, function(error, result) {
	var documents = {indicator: {}, project: {}, theme: {}, type: {}, input: {}, user: {}, report: {}};
	result.rows.forEach(function(item) {
		if (item.id.substring(0, '_design'.length) !== '_design')
			documents[item.doc.type][item.doc._id] = item.doc;
	});

	var docsToUpdate = [];

	var id;

	documents.project['d731aad7-74d2-4a7b-aa33-4f3eb8866cfd'].forms[0].elements = [
		{
			"id": "2f32f8f0-1bfd-452a-995b-3470bc986d3a",
			"name": "Number of consultations",
			"geoAgg": "sum",
			"timeAgg": "sum",
			"partitions": [
				[
					{ "id": "e1892b59-d515-48d4-a342-f370c82729b9", "name": "Upper respiratory infections" },
					{ "id": "71dcb6c9-d6f1-4654-bdf9-61149ff721fb", "name": "Lower respiratory infections" },
					{ "id": "cf71dce1-4348-4da5-b362-f20103791096", "name": "Watery diarrohea" },
					{ "id": "eef8fa1f-f634-48b6-ba61-66828946a7ec", "name": "Bloody diarrhoea" },
					{ "id": "361fb4aa-1188-494e-976f-65ba857acf2d", "name": "Malaria (Suspected)" },
					{ "id": "db5b5392-7967-40e0-8af7-663650aa9c83", "name": "Skin infections including scabies" },
					{ "id": "8b7cdddd-d841-4549-90f4-797934cc91d4", "name": "Eye infections" },
					{ "id": "be0b8137-7ef4-4ed7-a71b-896c05d28133", "name": "Ear infections" },
					{ "id": "0fde6144-408a-4cbc-ab6e-6c20bb3ca6cb", "name": "Dental conditions" },
					{ "id": "9bce5e50-0cfe-402e-ad76-9fbd6f28bb64", "name": "Intestinal worms" },
					{ "id": "1ba1e549-f090-47be-ae33-14a7365792cb", "name": "Acute jaundice syndrome" },
					{ "id": "3a057eeb-fc6d-40b3-93d4-6f998336955a", "name": "Measles" },
					{ "id": "40eb8849-5fb8-4928-a6b7-e26b36b0a2df", "name": "Meningitis (Suspected)" },
					{ "id": "2b8760ea-4316-4595-b15c-483403d6bd15", "name": "Acute flaccid paralysis" },
					{ "id": "b05290bf-dc56-4cc5-8f61-249a6f4244ae", "name": "Tuberculosis (suspected)" },
					{ "id": "520fcd59-8766-425a-8ffb-47afaa3cadb4", "name": "Fever of unknown origin" },
					{ "id": "27a2eceb-4fd1-441a-84e5-475f88fb0cc2", "name": "Sexually transmitted infections" },
					{ "id": "dca4993e-5c89-4508-a164-7bde004ea301", "name": "Urinary tract infections" },
					{ "id": "183ac437-da2b-41d5-8490-2d0e63bc2e93", "name": "Chicken Pox / Varicella Zoster Virus" },
					{ "id": "2638b206-d003-43bf-81cb-d92ea042c966", "name": "Acute Malnutrition" },
					{ "id": "32948c52-ba57-44cd-86d0-2baa1b184275", "name": "Leishmaniasis" },
					{ "id": "dde8bb49-dd81-419d-bf22-a0e092e6e9d8", "name": "Gynaecological conditions" },
					{ "id": "bbaa5900-822e-4b3a-ac48-5c2b6ea1bac9", "name": "Anaemia" },
					{ "id": "034a625f-e90e-4832-b624-afab34521144", "name": "Musculoskeletic Pain" },
					{ "id": "f97ec32d-e65c-43f3-b205-865b4f4cc283", "name": "Others" },
					{ "id": "cfe1bf07-1bdd-4503-9255-2582ba0056d5", "name": "Diabetes" },
					{ "id": "25828308-f5ee-4a48-ac9e-e47cdfc032d7", "name": "Hypertension" },
					{ "id": "cd9f5eba-24d7-4b30-ba8d-587c8d6f37ea", "name": "Asthma" },
					{ "id": "be69192c-3ac7-47b7-b6fc-2b889184c978", "name": "Ischaemic Heart Disease" },
					{ "id": "e7cbec9d-14b0-43e1-9e81-e0606e2780b9", "name": "Cardiovascular Diseases" },
					{ "id": "0ab0ef8e-fcb0-4d4c-9f5b-84a0902857ea", "name": "Chronic obstructive pulmonary diseases " },
					{ "id": "31cc5ff4-945f-402b-acfc-541234cd1f3c", "name": "Liver diseases" },
					{ "id": "aa7bc2df-1674-4721-82eb-27a6c029df72", "name": "Thyroid problems" },
					{ "id": "ea5c9624-cecf-4aa4-93e3-099546c344c3", "name": "Cancer" },
					{ "id": "2b604acd-4c80-4ced-95e6-21df757562aa", "name": "Gastritis or peptic ulcer" },
					{ "id": "4dc9adce-debf-4896-83de-85ee959d5c71", "name": "Others" },
					{ "id": "452f32e6-c5b7-4449-b321-06936a799996", "name": "Epilepsy / seizures" },
					{ "id": "ea52d780-1fca-4b56-8909-855bb8e8dc60", "name": "Alcohol and other substance abuse disorder" },
					{ "id": "1cb56737-5be9-4ecf-b73b-58e232afcb97", "name": "Psychotic disorder" },
					{ "id": "636ff1a4-053a-41c6-a0b4-8b9453731ee2", "name": "Mental retardation /intellectual disability" },
					{ "id": "8af3a746-b4db-4f85-8c49-5c59fde589b4", "name": "Severe emotional disorder" },
					{ "id": "4a30b28d-14d1-4e3f-b30f-678454248a6a", "name": "Medically unexplained somatic complaint" },
					{ "id": "4ef75a80-b722-40c8-8094-016f206c812e", "name": "Others" },
					{ "id": "38243392-94ec-446c-905a-1dd6f1fd215f", "name": "Injury (intentional)" },
					{ "id": "fd096d63-7662-4ca0-9910-0157548df60e", "name": "Injury (unintentional)" },
					{ "id": "5d0a5d2e-b07c-457a-85a7-fd6bbdf0127b", "name": "Burns" },
					{ "id": "2099dbe1-b652-4213-8081-d9933230e632", "name": "Accidents" },
					{ "id": "954988d9-464d-44e5-880f-776b09e36ab2", "name": "Bites" },
					{ "id": "d41b9bdb-e474-4cf8-9c03-21e4f08f0d4e", "name": "Others" },
					{ "id": "f30e11ef-9220-4b5a-a6d8-e753ed927361", "name": "Emergency" },
					{ "id": "cde20893-89d4-4dc6-859d-e9b58e8270fd", "name": "Elective" }
				],
				[
					{ "id": "81ef631d-8bdb-4f07-9867-a70416cbc18a", "name": "0 - 59 months" },
					{ "id": "e2a5073d-fe92-4987-89ea-41ae6bd9a0ec", "name": "5 - 14 years" },
					{ "id": "8f4824fc-385a-4327-9274-d492f7377a06", "name": "15 - 49 years" },
					{ "id": "c250d116-d320-4116-9d56-6a70158a87ed", "name": "50 years and above" }
				],
				[
					{ "id": "39b3ad0d-3646-441b-9b73-2f86bfd8d4c7", "name": "Male" },
					{ "id": "ed200436-1315-4418-bb78-47125ddbdc17", "name": "Female" }
				]
			]
		}
	];

	docsToUpdate.push(documents.project['d731aad7-74d2-4a7b-aa33-4f3eb8866cfd']);

	// fix inputs
	for (id in documents.input) {
		var input = documents.input[id];
		if (input.form !== '5c25f9c7-51b5-441f-8831-0587be598ffc')
			continue;

		input.values = {
			'2f32f8f0-1bfd-452a-995b-3470bc986d3a': 
				input.values["e1892b59-d515-48d4-a342-f370c82729b9"].concat(
				input.values["71dcb6c9-d6f1-4654-bdf9-61149ff721fb"].concat(
				input.values["cf71dce1-4348-4da5-b362-f20103791096"].concat(
				input.values["eef8fa1f-f634-48b6-ba61-66828946a7ec"].concat(
				input.values["361fb4aa-1188-494e-976f-65ba857acf2d"].concat(
				input.values["db5b5392-7967-40e0-8af7-663650aa9c83"].concat(
				input.values["8b7cdddd-d841-4549-90f4-797934cc91d4"].concat(
				input.values["be0b8137-7ef4-4ed7-a71b-896c05d28133"].concat(
				input.values["0fde6144-408a-4cbc-ab6e-6c20bb3ca6cb"].concat(
				input.values["9bce5e50-0cfe-402e-ad76-9fbd6f28bb64"].concat(
				input.values["1ba1e549-f090-47be-ae33-14a7365792cb"].concat(
				input.values["3a057eeb-fc6d-40b3-93d4-6f998336955a"].concat(
				input.values["40eb8849-5fb8-4928-a6b7-e26b36b0a2df"].concat(
				input.values["2b8760ea-4316-4595-b15c-483403d6bd15"].concat(
				input.values["b05290bf-dc56-4cc5-8f61-249a6f4244ae"].concat(
				input.values["520fcd59-8766-425a-8ffb-47afaa3cadb4"].concat(
				input.values["27a2eceb-4fd1-441a-84e5-475f88fb0cc2"].concat(
				input.values["dca4993e-5c89-4508-a164-7bde004ea301"].concat(
				input.values["183ac437-da2b-41d5-8490-2d0e63bc2e93"].concat(
				input.values["2638b206-d003-43bf-81cb-d92ea042c966"].concat(
				input.values["32948c52-ba57-44cd-86d0-2baa1b184275"].concat(
				input.values["dde8bb49-dd81-419d-bf22-a0e092e6e9d8"].concat(
				input.values["bbaa5900-822e-4b3a-ac48-5c2b6ea1bac9"].concat(
				input.values["034a625f-e90e-4832-b624-afab34521144"].concat(
				input.values["f97ec32d-e65c-43f3-b205-865b4f4cc283"].concat(
				input.values["cfe1bf07-1bdd-4503-9255-2582ba0056d5"].concat(
				input.values["25828308-f5ee-4a48-ac9e-e47cdfc032d7"].concat(
				input.values["cd9f5eba-24d7-4b30-ba8d-587c8d6f37ea"].concat(
				input.values["be69192c-3ac7-47b7-b6fc-2b889184c978"].concat(
				input.values["e7cbec9d-14b0-43e1-9e81-e0606e2780b9"].concat(
				input.values["0ab0ef8e-fcb0-4d4c-9f5b-84a0902857ea"].concat(
				input.values["31cc5ff4-945f-402b-acfc-541234cd1f3c"].concat(
				input.values["aa7bc2df-1674-4721-82eb-27a6c029df72"].concat(
				input.values["ea5c9624-cecf-4aa4-93e3-099546c344c3"].concat(
				input.values["2b604acd-4c80-4ced-95e6-21df757562aa"].concat(
				input.values["4dc9adce-debf-4896-83de-85ee959d5c71"].concat(
				input.values["452f32e6-c5b7-4449-b321-06936a799996"].concat(
				input.values["ea52d780-1fca-4b56-8909-855bb8e8dc60"].concat(
				input.values["1cb56737-5be9-4ecf-b73b-58e232afcb97"].concat(
				input.values["636ff1a4-053a-41c6-a0b4-8b9453731ee2"].concat(
				input.values["8af3a746-b4db-4f85-8c49-5c59fde589b4"].concat(
				input.values["4a30b28d-14d1-4e3f-b30f-678454248a6a"].concat(
				input.values["4ef75a80-b722-40c8-8094-016f206c812e"].concat(
				input.values["38243392-94ec-446c-905a-1dd6f1fd215f"].concat(
				input.values["fd096d63-7662-4ca0-9910-0157548df60e"].concat(
				input.values["5d0a5d2e-b07c-457a-85a7-fd6bbdf0127b"].concat(
				input.values["2099dbe1-b652-4213-8081-d9933230e632"].concat(
				input.values["954988d9-464d-44e5-880f-776b09e36ab2"].concat(
				input.values["d41b9bdb-e474-4cf8-9c03-21e4f08f0d4e"].concat(
				input.values["f30e11ef-9220-4b5a-a6d8-e753ed927361"].concat(
				input.values["cde20893-89d4-4dc6-859d-e9b58e8270fd"]))))))))))))))))))))))))))))))))))))))))))))))))))
		};

		docsToUpdate.push(input);
	}

	console.log(docsToUpdate.length)
	
	old.bulk({docs: docsToUpdate}, function(error, done) {
		console.log(error);
	});

});

