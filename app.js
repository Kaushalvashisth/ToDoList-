const express =require("express");
const bodyParser =require("body-parser");
const mongoose=require("mongoose")
// local modules:
const date = require(__dirname+"/date.js");
// console.log(date);
const app=express();

// this line is always below express()
app.set("view engine","ejs");

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

// mongoos
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});
const itemSchema=new mongoose.Schema({
    name:String
});

const Item=new mongoose.model("Item",itemSchema);

// add new items
const item1=new Item({
    name:"Welcome to your Notes!"
});
const item2=new Item({
    name:"Hit the + button to add a new item!"
});
const item3=new Item({
    name:"<-- Hit this button to delete an item!"
});
const defaultItems=[item1,item2,item3];

// for custom lists
const listSchema={
    name:String,
    items:[itemSchema]
};
const List=mongoose.model("List",listSchema);

app.get("/",(req,res)=>{

    // var currentDay=today.getDay();
    // var dayList=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
    let day = date.getDate();
    Item.find({},function(err,item) {
        if(item.length===0){
            Item.insertMany(defaultItems,function(err){
                err?console.log(err):console.log("inserted default array");
            });
            res.redirect("/");
        }else{
            res.render("list",{ListTitle:day,listItems:item});
        }
    })
});

app.get('/favicon.ico', (req,res)=>{
    return 'your faveicon'
   });
   
app.get("/:customListName",function(req,res){
    let customListName=req.params.customListName;
    customListName=customListName[0].toUpperCase()+customListName.slice(1).toLowerCase();
    // console.log(customListName);
    List.findOne({name:customListName},function(err,foundList){
        if(!err){
            if(!foundList){
                // console.log("doesn't exist");
                // create new list
                const list=new List({
                    name:customListName,
                    items:defaultItems
                });
            
                list.save();
                res.redirect("/"+customListName);
            }else{
                // console.log("exists");
                res.render("list",{ListTitle:foundList.name,listItems:foundList.items})
            }
        }
    })
    
});
app.post("/",(req,res)=>{
    // console.log(req.body)
    const item= req.body.newItem;//bodyParser
    const listName=req.body.List;

    // console.log(listName===date.getDate());

    const addedItem=new Item({
        name:item
    });
    
    if(listName===date.getDate()){
        addedItem.save();
        res.redirect("/");
    }else{
        List.findOne({name: listName},function(err,foundlist){
            if(err){
                console.log(err);
            }else{
                foundlist.items.push(addedItem);
                foundlist.save();
                res.redirect("/"+listName);
            }
            
        });
    }
})
app.post("/delete",(req,res)=>{
   const checkedItemId=req.body.checkbox;
   const listName=req.body.listName;
   if(listName===date.getDate()){
        Item.findByIdAndRemove(checkedItemId,function(err){
            err?console.log(err):console.log("deleted success");
            res.redirect("/");
        });
   }else{
    //    item array ko pull kia usme id  check kri aur delete kri
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},function(err,foundList){
            if(!err){
                res.redirect("/"+listName);
            }
        });
   }
});
// app.get("/work",(req,res)=>{
//     res.render("list",{ListTitle:"Work List",listItems:workItem})
// });
// app.post("/work",(req,res)=>{
//     let item=req.body.newItem;
//     workItem.push(item);
//     res.redirect("/work");
// })

// app.get("/about",(req,res)=>{
//     res.render("about");
// })
app.listen(5000,()=>{
    console.log('app on port : "http://localhost:5000/"');
});