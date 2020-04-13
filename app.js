//jshint esversion:6
//DB psw: 9GdgaUvrdOSFlRND ; usr: gmachado
//mongo "mongodb+srv://cluster0-g6lo9.gcp.mongodb.net/test"  --username gmachado

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require('lodash');
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));


//=================Mongoose stuff======================


mongoose.connect('mongodb+srv://gmachado:9GdgaUvrdOSFlRND@cluster0-g6lo9.gcp.mongodb.net/todolistDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model('item', itemSchema);

item1 = new Item({
  name: 'Wake up!'
});

item2 = new Item({
  name: 'Brush my teeth'
});

item3 = new Item({
  name: 'Get some coffe'
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items:[itemSchema]
});

const List = mongoose.model('List',listSchema);
//======================Server stuff===========================


app.get("/", function(req, res) {

  //Checking the items
  Item.find({}, function(err, results) {
    if (err) console.log(err);
    else console.log(results);

    if (results.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) console.log(err);
        else console.log('That was pretty easy');
      });

      res.redirect('/');
    }
    else {
      res.render("list", {
        listTitle: date.getDate(),
        newListItems: results
      });
    }
  });



});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({name: itemName});

  if(listName===date.getDate()){
    item.save();
    res.redirect('/');
  }
  else{
    List.findOne({name: listName}, function(err, result){
      console.log('Pushing '+itemName+' to the '+listName+' list:');
      result.items.push(item);
      result.save();
      res.redirect('/'+listName);
    });
  }

});

app.post('/delete', function(req, res){
  console.log(req.body);
  const origin=req.body.hiddenCheck;
  const elementId=req.body.checkbox;

  if(origin==date.getDate()){
    Item.findByIdAndRemove(req.body.checkbox, function(err){
      if(err) console.log(err);
      else console.log("Removed: "+req.body.checkbox);
      res.redirect('/');
    });
  }
  else{
    List.findOneAndUpdate({name:origin},{$pull: {items:{_id: elementId}}}, function(err){
      console.log(`Removed ${elementId} from list ${origin}`);
      res.redirect('/'+origin);
    });
  }

});

app.get("/:kind", function(req, res) {
  const customListName=_.capitalize(req.params.kind);

  List.findOne({name: customListName}, function(err, result){
    if(result){
      console.log('These are the items that are going to be rendered now', result);
      //rendering the page for the user
      res.render("list", {
        listTitle: result.name,
        newListItems: result.items
      });
    }
    else{
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      console.log('A new list was created');
      res.redirect('/'+customListName);
    }
  });
});

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(process.env.PORT||3000, function() {
  console.log("Server started");
});
