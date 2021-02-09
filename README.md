# Repl DB ORM

A quick experiment to build an ORM on top of (Repl.it)[https://repl.it]'s existing key/value based database.

[More information about Repl's database can be found here](https://docs.repl.it/misc/database)

## Usage

```
const {model, Schema} = require('repl-db-orm');

// Define a schema, what fields we want and their types
var testSchema = {
  Property1: Number,
  Words: String
};

// Create the model, specify the name and can specify the "table"
// as a third param which is just how we store the keys
const testModel = model("test", testSchema);


(async () => {
  // Create a new object by our model
  let a = new testModel({Property1: 55, Words: "Test test"});

  // save it to the db
  await a.save()

  // Find matches!
  testModel.find({Property1: 55}).then(console.log);
})();

```

## How it works
Each model property is saved as a key/value based on the schema definition.

Since we know the first part of the keys, we can query by rough matches to find models of a certain type with matching property values.

Then we can pull the model id out of the key itself with some simple regex.


## Contributing
Feel free to open PRs to improve this, it's still missing quite a few key features for usage such as delete, findOne, or a way to add other where clauses like OR.