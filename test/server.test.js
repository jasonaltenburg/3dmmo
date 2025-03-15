const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const express = require('express');
const path = require('path');

describe('Server Tests', function() {
  let app;

  before(function() {
    // Create a test server instance
    app = express();
    app.use(express.static(path.join(__dirname, '../public')));
  });

  it('should serve the index.html file', function(done) {
    request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        expect(res.text).to.include('3D MMO');
        done();
      });
  });

  it('should serve static files from public directory', function(done) {
    request(app)
      .get('/js/main.js')
      .expect('Content-Type', /javascript/)
      .expect(200, done);
  });
});