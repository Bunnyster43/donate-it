const router = require("express").Router();
const User = require("../models/User.js");
const Category = require("../models/Category.js");
const Item = require("../models/Item.js");

const encrypt = require("../encryption.js");


//authenticating user
router.get("/auth", function(req, res) {
    // send back "session" status
    res.json(req.session.user);
});
//signup
// router.post("/signup",function(req,res){
//   User.create(
//      req.body
//   ).then((dbUser)=>{
//       res.json(dbUser)
//   }).catch((err)=>{
//       res.json(err);
//   });
// })
//signup
router.post("/signup",function(req,res){
  User.create(
     {username: req.body.username, password:encrypt.encrypt(req.body.password),firstname:req.body.firstname, lastname:req.body.lastname, city:req.body.city, state: req.body.state,phonenumber:req.body.phonenumber, email:req.body.email,zipcode:req.body.zipcode}
  ).then((dbUser)=>{
      res.json(dbUser)
  }).catch((err)=>{
      res.json(err);
  });
})

//login
// router.post("/login",function(req,res){
//   User.findOne({ $and: [{username: req.body.username}, {password: req.body.password}] })
//   .then(function(dbUser) {
//       if(dbUser!==null){
//           req.session.user = dbUser;
//       }
//       res.json(req.session.user);
//   })
//   .catch(function(err) {
//     res.json(err);
//   });
// })

router.post("/login",function(req,res){
  User.findOne({username: req.body.username})
  .then(function(dbUser) {
    if (dbUser!==null){
      var decryptPW= encrypt.decrypt(dbUser.password)
      if(decryptPW===req.body.password){
        req.session.user = dbUser;
        return res.json(req.session.user);
      }
      else{
        return res.json("invalid");
      }
    }
    else{
      return res.json("invalid");
    }
   
  })
  .catch(function(err) {
    res.json(err);
  });
})

//logout
router.get('/logout',function (req, res) {
    req.session.destroy();
    return res.json(req.session);
});

//bad. need to modify this.
// home page search by name, category, zipcode, radius
router.get("/search-items",function(req,res){
  var name=req.query.name;
  var categoryId=req.query.selectValue;
  var zipcode=req.query.zipCodes;
  var q =[{$or:[{status:"Declined"},{status:"Nil"}]}];
  if(name){
    q.push({name:{ $regex: name + '.*',$options: 'i'}})
  }
  if(categoryId){
    q.push({category:categoryId})
  }
  var query=[];
  if(zipcode!==undefined){
     for(var i=0; i<zipcode.length;i++){
       query.push({zipcode:zipcode[i]});
     }
     var obj={path:"user", select:"city zipcode",match:{$or:query}};
   }
   else{
     var obj={path:"user",select:"city zipcode"};
  }
  if(q.length!==0){
     var obj1= {$and: q};
  }
  else{
    var obj1= {};
  }
  // console.log(obj1);
  Item.find(obj1).sort([['dateCreated', -1]])
     .populate("category")
     .populate(obj)
    .then(function(dbItem){
       var filteredItem = dbItem.filter(item => item.user !== null);
       res.json(filteredItem);
    })
    .catch(function(err){
        res.json(err);
    })
})

  

  // Route for retrieving a single item from the db with category and user
  router.get("/item/:id", function(req, res) {
    Item.findOne({_id : req.params.id})
      .populate("category")
      .populate("user")
      .then(function(dbItem) {
        res.json(dbItem);
      })
      .catch(function(err) {
        res.json(err);
      });
  });
  
  //inserts a category into database
  router.post("/insert-category", function(req, res) {
    Category.create({
      name: req.body.name,
    })
    .then(function(result) { 
      res.json(result);
    })
    .catch(function(err) {
      res.json(err);
    })
  });

  
  // Find all categories
  router.get("/categories", function(req, res) {
    Category.find({})
      .then(function(dbCategory) {
        res.json(dbCategory);
      })
      .catch(function(err) {
        res.json(err);
      });
  });
  
  
 //creates an item and adds reference to user
  router.post("/additem-to-user", function(req, res) {
    Item.create(
        {name: req.body.name,
        description: req.body.description,
        condition: req.body.condition,
        note: req.body.note,
        category: req.body.selectValue,
        user: req.body.user,
        img:req.body.img}
      )
      .then(function(dbItem) {
        res.json(dbItem);
        return User.findOneAndUpdate({_id: req.body.user}, { $push: { item: dbItem._id } }, { new: true });
      })
    //   .then(function(dbUser) {
    //     res.json(dbUser);
    //   })
      .catch(function(err) {
        res.json(err);
      });
  });
  
 // Route to get a user with their id
 router.get("/user/:id", function(req, res) {
  User.find({_id:req.params.id})
    .then(function(dbUser) {
      res.json(dbUser);
    })
    .catch(function(err) {
      res.json(err);
    });
});

  // //route for requesting an item..status:pending
  router.put("/request-item",function(req, res){
       Item.findOneAndUpdate({_id:req.body.itemId},{$set:{requestedBy: req.body.userId, status:req.body.status}})
    .then(function(dbItem) {
        res.json(dbItem);
     })
     .catch(function(err) {
      res.json(err);
    });
  });

  router.put("/editing-profile/:id",function(req,res){
    User.findOneAndUpdate({_id:req.params.id},{$set:{firstname:req.body.firstname, lastname:req.body.lastname, 
      city:req.body.city,state:req.body.state, zipcode:req.body.zipcode, phonenumber:req.body.phonenumber}})
      .then(function(dbUser) {
        console.log(dbUser);
        res.json(dbUser);
     })
     .catch(function(err) {
      res.json(err);
    });
  });
  
    //status: accept/decline
  router.put("/change-status",function(req, res){
      Item.findOneAndUpdate({_id:req.body.itemId},{$set:{status:req.body.reqStatus}})
   .then(function(dbItem) {
       res.json(dbItem);
    })
    .catch(function(err) {
     res.json(err);
   });
   });

   //get items that buyer has requested..i requested...wait for status..pending..accepted..declined
   router.get("/buyer-requests/:id",function(req, res){
     Item.find({requestedBy:req.params.id}).populate({path:"user",select:"_id username"})
     .then(function(dbItem){
       res.json(dbItem);
     })
     .catch(function(err){
       res.json(err);
     })
   })

   router.get("/buyer-requests-by-status/:id/:status",function(req, res){
    Item.find({$and:[{requestedBy:req.params.id},{status:req.params.status}]}).populate({path:"user",select:"_id username"})
    .then(function(dbItem){
      res.json(dbItem);
    })
    .catch(function(err){
      res.json(err);
    })
  })
    
   //get all items attached to seller..requested to me for my items..i'll either accept or decline it.
   router.get("/incoming-requests/:id",function(req, res){
    Item.find({$and:[{user:req.params.id},{ status: "Pending"}]}).populate({path:"requestedBy",select:"_id username"})
    .then(function(dbItem){
      res.json(dbItem);
    })
    .catch(function(err){
      res.json(err);
    })
  })

  router.get("/donated-items/:id",function(req, res){
    Item.find({$and:[{user:req.params.id},{ status: "Accepted"}]})
    .sort([['dateCreated', -1]])
    .populate({path:"requestedBy",select:"_id username"})
    .then(function(dbItem){
      res.json(dbItem);
    })
    .catch(function(err){
      res.json(err);
    })
  })
   

  //retrieving all available items for donation
  router.get("/items-donating/:id",function(req, res){
    Item.find({$and:[{user:req.params.id},{$or:[{status: "Nil"},{status:"Declined"}]}]}).populate({path:"user",select:"_id username"})
    .sort([['dateCreated', -1]])
    .then(function(dbItem){
      res.json(dbItem);
    })
    .catch(function(err){
      res.json(err);
    })
  })
  
  //recent 5 items...items ordered by date creation
  router.get("/recent-items",function(req,res){
      Item.find({$or:[{status:"Declined"},{status:"Nil"}]})
      .sort([['dateCreated', -1]]).limit(6).populate({path:"user",select:"zipcode city"}).populate("category")
      .then(function(dbItem){
          res.json(dbItem);
      })
      .catch(function(err){
          res.json(err);
      })
  })
    
//deleting an item available for donation
  router.delete("/delete/:itemId/user/:userId",function(req,res){
    // console.log(req.params.userId,req.params.itemId);
    Item.findByIdAndRemove(req.params.itemId).then(function(){
        return User.update({ _id: req.params.userId }, {$pull: {item:req.params.itemId}});
    }).then(function(dbUser) {
      res.json(dbUser);
    })
    .catch(function(err) {
      res.json(err);
    });
  });


module.exports = router;