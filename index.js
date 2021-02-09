const Client = require("@replit/database");
const db = new Client();

// A schema object, simply defines properties and data type
// mostly for casting the types
class Schema {
  constructor(props) {
    this.props = props;
  }
}

// Defines a Model, dynamic methods from the model function are required
// to get full features
class Model {
  constructor(props) {
    for(prop in props) {
      this[prop] = props[prop];
    }    
  }

  async save() {
    if (!this._id) {
      this._id = this._generateID();
    }

    let props = this._getProperties();
    for (prop in props){
      await db.set(`${this.constructor._getKey(prop, this._id)}`, this[prop]);
    }
  }
  

  // Return hydrated models that match
  // ALL of the provided where clauses (AND only)
  static find(where, matchedIDs = []) {
    
    return new Promise((resolve, reject) => {  
      let allKeys = Object.keys(where)
      let prop = allKeys[0];
      db.list(this._getKey(prop))
        .then(async matches => {

          for (let i = 0; i < matches.length; i++) {
            let value = await db.get(matches[i]);
            // If we find a matching prop value add
            // this model's ID to our match possibles 
            if (value == where[prop]) {

              // Obtain the model using regex on the key 
              let id = this.getIDFromKey(matches[i]);
              if(!matchedIDs.some(i => i == id)){
                matchedIDs.push(id);
              }
            }
          }

          if(allKeys.length > 1) {
            
            // Delete the prop we just used
            delete where[prop];
            
            // Easiest way to keep this readable is to just
            // recurse the promise here
            this.find(where, matchedIDs).then(resolve).catch(reject);
          
          } else {
            return resolve(this.getModelsForIDs(matchedIDs));
          }
        });
    });
  }

  // Hydrate the full models from a list of IDs
  static async getModelsForIDs(matchedIDs) {
    let models = [];
    let schema = this._getSchema();

    for(let i = 0; i < matchedIDs.length; i++) {
      let id = matchedIDs[i];
      let foundProps = {};
      for(prop in schema) {
        foundProps[prop] = await db.get(this._getKey(prop, id));
      }
      models.push(this._loadFromProperties(foundProps));
    }
    
    return models;
  }

  static getIDFromKey(key) {
    let regex = /.*_(_.*)$/g
    let matches = regex.exec(key);
    if(matches.length > 0){
      return matches[1];
    }
    return null;
  }

  static _loadFromProperties(props) {
    return new this(props);
  }

  _generateID() {
    return '_' + Math.random().toString(36).substr(2, 9);
  }

  // --- Everything under here is defined in the model function
  // dynamically.
  // We put these here just to help with hinting

  static _getSchema() {}

  _getProperties() {}

  static _getKey(prop, id = '') {}

  
}

function model(name, schema, tableKey = '') {
  if (tableKey == '') tableKey = name.toLowerCase();
  let modelClass = Model;

  // We need to set getter/setters on the class dynamically here
  // We do this so that we can just use obj.property and make it feel native
  for (prop in schema) {
    let propGetterSetter = {};
    propGetterSetter[prop] = {
            "get": function() { 
              return schema[prop](this[`_${prop}`]);
            },
            "set": function(value) { 
              this[`_${prop}`] = schema[prop](value);        
            }
        };
    Object.defineProperties(Model, propGetterSetter);
  }

  modelClass._getSchema = function() {
    return schema;
  }

  modelClass._getKey = function(prop, id = '') {
    return `${tableKey}_${prop}_${id}`;
  };

  modelClass.prototype._getProperties = function() {
    let modelValues = {_id: this._id};
    for(prop in schema) {
      modelValues[prop] = schema[prop](this[prop]);
    }
    return modelValues;
  };

  return modelClass;
}

module.exports = {
  Schema,
  model
}