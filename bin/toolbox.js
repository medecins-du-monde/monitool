#!/usr/bin/env node

"use strict";

var async     = require('async'),
	fs        = require('fs'),
	jsonpatch = require('fast-json-patch');

/**
 * Get all revisions ids of a document (in order)
 */
function getRevisionsIds(documents, documentId) {
	return Object.keys(documents[documentId]).sort(function(a, b) {
		return parseInt(a.substring(0, a.indexOf('-'))) - parseInt(b.substring(0, b.indexOf('-')));
	});
}

/**
 * Print diffs of revisions of doc
 */
function printRevisions(documents, documentId) {
	var previous = null;

	getRevisionsIds(documents, documentId).forEach(function(rev) {
		var doc = documents[documentId][rev];

		if (doc && previous) {
			var patch = jsonpatch.compare(previous, doc);
			console.log(previous._rev, doc._rev)
			console.log(JSON.stringify(patch, null, "\t").slice(3, -3).replace(/\}\,\{\"op\"/g, '}\n{op'))
		}
		else if (doc) {
			console.log(doc._rev, JSON.stringify(doc, null, "\t"))
		}
		console.log('')

		previous = doc;
	})
}


/**
 * Retrieve the ids of all documents related to a project.
 */
function loadProjectDocumentIds(db, projectId) {
	return new Promise(function(resolve, reject) {
		db.list({}, function(error, response) {
			if (error)
				return reject(error);

			var ids = response.rows.map(row => row.id).filter(id => !!id.match(projectId));
			resolve(ids);
		});
	});
}

/**
 * Retrieve all available revisions of a document.
 */
function loadDocumentRevisions(db, documentId) {
	return new Promise(function(resolve, reject) {
		db.get(documentId, {revs_info: true}, function(error, doc) {
			if (error)
				return reject(error);

			var revisions = {};

			async.eachSeries(
				doc._revs_info,
				function(revision, callback) {
					if (revision.status !== 'available') {
						revisions[revision.rev] = null;
						callback(null);
					}
					else {
						db.get(documentId, {rev: revision.rev}, function(error, doc_rev) {
							revisions[revision.rev] = doc_rev;
							callback(null)
						});
					}
				},
				function(error) {
					resolve(revisions);
				}
			)
		});
	});
}


/**
 * {docId: {revId: {version}, revId2: {version} }}
 */
function loadProjectHistory(db, projectId) {
	return loadProjectDocumentIds(db, projectId).then(function(documentIds) {
		return new Promise(function(resolve, reject) {
			var revisions = {};

			async.eachLimit(
				documentIds,
				10,
				function(documentId, callback) {
					loadDocumentRevisions(db, documentId).then(function(docRevs) {
						revisions[documentId] = docRevs;
						callback();
					}).catch(function(error) {
						console.log(error)
						revisions[documentId] = null;
						callback();
					});
				},
				function(error) {
					resolve(revisions);
				}
			);
		});
	});
}

module.exports = {
	getRevisionsIds: getRevisionsIds,
	printRevisions: printRevisions,
	loadProjectDocumentIds: loadProjectDocumentIds,
	loadDocumentRevisions: loadDocumentRevisions,
	loadProjectHistory: loadProjectHistory
}


