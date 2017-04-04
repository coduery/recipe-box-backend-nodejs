// To create models run 'node create-models.js' within /server/bin folder
var fs = require('fs');
var loopback = require('loopback');

var ds = loopback.createDataSource('mysql', {
  "host": "127.0.0.1",
  "port": 3306,
  "database": "recipe_box",
  "username": "root",
  "password": "heu7_Wyhb6xC"
});

let modelPath = '../../common/models/'
fs.stat(modelPath, function(err, stats) {
  if (err) {
    fs.mkdir(modelPath, createModels(modelPath, function() {
        done();
      })
    );
  } else {
    createModels(modelPath, function() {
      done();
    });
  }
});

function createModels(modelPath, callback) {
  ds.discoverModelDefinitions({schema: 'recipe_box'}, function(err, models) {
    if (err) {
      console.error(err);
    }

    let modelRelations = {
      "category": {
        "recipes": {
          "type": "hasMany",
          "model": "Recipe",
          "foreignKey": "categoryId"
        }
      }
    };

    let count = models.length;
    for (let i = 0; i < models.length; i++) {
      let tableName = models[i].name;

      ds.discoverSchema(tableName, function(err, schema) {
        if (err) {
          console.error(err);
        }

        let schemaName = schema.name.toLowerCase();
        let jsonFilename = schemaName + '.json';

        if (modelRelations[schemaName]) {
          schema["relations"] = modelRelations[schemaName];
        }

        fs.writeFile(modelPath + jsonFilename, JSON.stringify(schema, null, 2), function(err) {
          if (err) {
            console.error(err);
          } else {
            console.log("Created " + jsonFilename);
          }
        });

        let jsFilename = schemaName + '.js';
        let jsContent = "'use strict';\r\r" +
                        "module.exports = function(" + schema.name + ") {\r\r};"
        fs.writeFile(modelPath + jsFilename, jsContent, function(err) {
          if (err) {
            console.error(err);
          } else {
            console.log("Created " + jsFilename);
          }

          count--;
          if (count == 0) {
            ds.disconnect(function() {
              configModels(models, function() {
                callback();
              });
            });
          }
        });
      });
    }
  });
}

function configModels(models, callback) {
  let modelConfig = require('../model-config.json');
  let dataSourceConfig = { 
    "dataSource": "recipe-box",
    "public": true
  };
  let isNewModel = false;

  models.forEach(function(model) {
    let name = model.name.charAt(0).toUpperCase() + model.name.slice(1);
    if (!modelConfig.hasOwnProperty(name)) {
      isNewModel = true; 
      modelConfig[name] = dataSourceConfig;
    }
  });

  if (isNewModel) {
    fs.rename('../model-config.json', '../model-config.backup.json', function(err, data) {
      if (err) {
        console.error(err);
      }
      fs.writeFile('../model-config.json', JSON.stringify(modelConfig, null, 2), function(err) {
        if (err) {
          console.error(err);
        } else {
          console.log("Models configured in model-config.json");
        }
      });
      callback();
    });
  } else {
    callback();
    console.log("Models already configured in model-config.json");
  }
}

function done() {
  console.log("Done creating models");
}