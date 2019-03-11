/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.DB; 

module.exports = function (app) {

  app.route('/api/issues/:project')
  
  .get(function (req, res){
      var project = req.params.project;
      var search = req.query;
      if (search._id) { search._id = new ObjectId(search._id)}
      
      if ((typeof(search.open) !== undefined) && (req.query.open !=  undefined)) {        
        search.open = req.query.open === 'true' ? true : false;
      } 
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        db.collection(project).find(search).toArray((err, arr) => {
          if(err) {
           res.send(err); 
          }
          res.send(arr);
        });
      });
    })
    
    .post(function (req, res){
      var project = req.params.project;
    
      if ((req.body.issue_title === undefined) || (req.body.issue_text === undefined) || (req.body.created_by === undefined)) {
        
        res.send("missing inputs");
      } else {
          var insert = {
            issue_title: req.body.issue_title,
            issue_text: req.body.issue_text,
            created_on: new Date(),
            updated_on: new Date(),
            created_by: req.body.created_by,
            assigned_to: req.body.assigned_to ? req.body.assigned_to : '',
            open: true,
            status_text: req.body.status_text ? req.body.status_text : ''
          };
          MongoClient.connect(CONNECTION_STRING, function(err, db) {
            db.collection(project).insertOne(insert, (err, data) => {
              if(err) {
               res.send(err); 
              }
              res.json(insert);
            });
          });      
       }
    })

    .put(function (req, res){
      var project = req.params.project;
      var id = req.body._id;
      if (id === undefined) {
        res.send("missing input");
      } else {
          var changes = req.body;
          function removeEmpty(obj) {
            Object.keys(obj).forEach((key) => 
                  (obj[key] == '') && delete obj[key] ||
                  (key === '_id') && delete obj[key]);
          };
          removeEmpty(changes);        
          console.log(Object.keys(changes).length);
          if ( Object.keys(changes).length === 0) {
            res.send("no updated field sent");
          } else {
            if (changes.open == 'false') {
              changes.open = false;
            }
            changes.updated_on = new Date();
            console.log(changes);
            MongoClient.connect(CONNECTION_STRING, (err, db) => {
              db.collection(project).findAndModify({_id: ObjectId(id)}, {}, {$set: changes}, {new: true}, (err, doc) => {
               if  (err)  res.send("could not update " + id) 
               else res.send("successfully updated");
              });
             });
          }
        }
    }) 
  
    .delete(function (req, res){
      var project = req.params.project;
      var id = req.body._id;
    
      if (id === undefined) {
        res.send("_id error");
      } else {
        MongoClient.connect(CONNECTION_STRING, function(err, db) {
          db.collection(project).findOne({"_id":ObjectId(id)}, (err, data) => {
            if (err) {
              res.send(err);             
            }
             if (data) {
              db.collection(project).deleteOne({"_id":ObjectId(id)}, (err, data) => {
                if (err) {
                  res.send(err); 
                }
                  res.send("deleted " + id);
                  console.log("deleted " + id);
                });                                 
               } else {
                 res.send("could not delete " + id);
               }
              });            
          });
      }     
    });    
};
