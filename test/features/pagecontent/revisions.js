'use strict';

// mocha defines to avoid JSHint breakage
/* global describe, it, before, beforeEach, after, afterEach */

var assert = require('../../utils/assert.js');
var preq   = require('preq');
var server = require('../../utils/server.js');


describe('revision requests', function() {

	var revOk = 642497713;
	var revDeleted = 645504917;

    this.timeout(20000);

    before(function () { return server.start(); });

    it('should return valid revision info', function() {
        return preq.get({ uri: server.config.bucketURL + '/revision/' + revOk })
        .then(function(res) {
            assert.deepEqual(res.status, 200);
            assert.deepEqual(res.body.items.length, 1);
            assert.deepEqual(res.body.items[0].rev, revOk);
            assert.deepEqual(res.body.items[0].title, 'Foobar');
        });
    });

    it('should query the MW API for revision info', function() {
        var slice = server.config.logStream.slice();
        return preq.get({
            uri: server.config.bucketURL + '/revision/' + revOk,
            headers: { 'cache-control': 'no-cache' }
        })
        .then(function(res) {
            slice.halt();
            assert.deepEqual(res.status, 200);
            assert.deepEqual(res.body.items.length, 1);
            assert.deepEqual(res.body.items[0].rev, revOk);
            assert.deepEqual(res.body.items[0].title, 'Foobar');
            assert.remoteRequests(slice, true);
        });
    });

    it('should fail for an invalid revision', function() {
        return preq.get({ uri: server.config.bucketURL + '/revision/faultyrevid' })
        .then(function(res) {
            throw new Error('Expected status 400 for an invalid revision, got ' + res.status);
        },
        function(res) {
            assert.deepEqual(res.status, 400);
        });
    });

    it('should query the MW API for a non-existent revision and return a 404', function() {
        var slice = server.config.logStream.slice();
        return preq.get({ uri: server.config.bucketURL + '/revision/0' })
        .then(function(res) {
            slice.halt();
            throw new Error('Expected status 404 for an invalid revision, got ' + res.status);
        },
        function(res) {
            slice.halt();
            assert.deepEqual(res.status, 404);
            assert.remoteRequests(slice, true);
        });
    });

    it('should fail for a restricted revision fetched from MW API', function() {
        return preq.get({
            uri: server.config.bucketURL + '/revision/' + revDeleted,
            headers: { 'cache-control': 'no-cache' }
        })
        .then(function(res) {
            throw new Error('Expected status 403 for a restricted revision, got ' + res.status);
        },
        function(res) {
            assert.deepEqual(res.status, 403);
        });
    });

    it('should fail for a restricted revision present in storage', function() {
        return preq.get({ uri: server.config.bucketURL + '/revision/' + revDeleted })
        .then(function(res) {
            throw new Error('Expected status 403 for a restricted revision, got ' + res.status);
        },
        function(res) {
            assert.deepEqual(res.status, 403);
        });
    });

    //it('should list stored revisions', function() {
    //    return preq.get({ uri: server.config.bucketURL + '/revision/' })
    //    .then(function(res) {
    //        assert.deepEqual(res.status, 200);
	//		assert.contentType(res, 'application/json');
	//		// at least the revisions from this test file
	//		// should be present in storage
	//		assert.deepEqual(res.body.items.some(function(revId) {
	//			return revId === revOk;
	//		}), true);
	//		assert.deepEqual(res.body.items.some(function(revId) {
	//			return revId === revDeleted;
	//		}), true);
    //    });
    //});

});

