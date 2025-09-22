const express = require('express');
const cors = require('cors');
const app = express();

const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const router =require('express').Router();
 const User =    require('./models/User');
 const Post =    require('./models/Post');
 const Category= require('./models/Category');
 
 const multer = require('multer');
// Removed redundant imports - using User model directly
require("dotenv").config() // haven't used dotenv.config()
const bcrypt = require('bcrypt');
const path = require('path');

app.use(express.json());
// app.use("/images", express.static(path.join(__dirname, "/images")));
app.use("/images", express.static(path.join(__dirname,"/images")));
const corsOptions = {
  origin: 'https://react-blogf.netlify.app',
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // if you need cookies or auth headers
  // other options...
};

app.use(cors(corsOptions));





const mongo_url = process.env.MONGO_URL || "mongodb://localhost:27017/reactblog"; // Read from .env or use default

async function connect() {
    try {
        await mongoose.connect(mongo_url);
        console.log("Connected to MongoDB successfully!");
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        console.log("Please make sure MongoDB is installed and running");
        console.log("You can install MongoDB from: https://www.mongodb.com/try/download/community");
        console.log("Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas");
        // Don't exit, let the server run without DB for now
    }
}

connect();



// app.listen(5000, ()=>{  // WITHOUT ENV 
//     console.log("Port is running ");
// });   


const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>{
    console.log("=================================");
    console.log(`Server is running on port ${PORT}`);
    console.log(`Visit: http://localhost:${PORT}`);
    console.log("=================================");
});


// app.use("/api/auth", authRoute);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, req.body.name);
  },
});

const upload = multer({ storage: storage });
app.post("/upload", upload.single("file"), (req, res) => {
  res.status(200).json("File has been uploaded");
});





  /*-------- We created rest api to fetch data from the request or from the user.*/
  //This is for taking the data from the user
/*app.use('/register',(req, res)=>{  // can use app.post
    console.log(req.body)        
    res.send(req.body)
})*/

//Now for saving data we get from the request or client to the database //Fetching and Saving
//Registration
app.post('/register', async(req, res)=>{  // Fixed: using POST method
     try{
        console.log("Registration attempt for:", req.body.username, req.body.email);
        const salt= await bcrypt.genSalt(10);
        const hasedPass= await bcrypt.hash(req.body.password, salt)
      const register = await User.create({
        username: req.body.username,
        email: req.body.email,
         password:hasedPass,                  // password:req.body.password
      });
      console.log("User registered successfully:", register.username);
      res.status(200).send(register);
     }catch(error){
      console.log("Registration error:", error.message);
      res.status(500).json({message: error.message})
     }
  })

//login
app.post('/login' , async (req,res) =>{
    try {
        const identifier = (req.body.username || "").trim();
        console.log("Login attempt for identifier:", identifier);
        const user = await User.findOne({
            $or: [{ username: identifier }, { email: identifier }]
        });
        console.log("User found:", user ? "Yes" : "No");
        if(!user){
            console.log("User not found");
            return res.status(400).json("wrong credentials")
        }
        const validated = await bcrypt.compare(req.body.password, user.password);
        console.log("Password validated:", validated);
        if(!validated){
            console.log("Invalid password");
            return res.status(400).json("wrong credentials");
        }
        const { password, ...userWithoutPassword } = user.toObject();
        res.status(200).json(userWithoutPassword);
    } catch(err){
        console.error("Login error:", err);
        res.status(500).json(err);
    }
});


//update user
app.put('/users/:id', async  (req, res) =>{
    try{
      const {id}=req.params;
      const user = await User.findByIdAndUpdate(id, req.body, { new: true })
      if(!user){
          return res.status(404).json({message:`cannot find user ${id}`})
      }
      const { password, ...userWithoutPassword } = user.toObject();
      res.status(200).json(userWithoutPassword);
    }
    catch(error){
      res.status(500).json({message: error.message});
    }
  })

  
//   mongoose.set("strictQuery",false);

//delete user
  app.delete('/users/:id', async (req, res) =>{
    try{
        const {id} = req.params;
        const user= await User.findByIdAndDelete(id);
        if(!user){
            return res.status(404).json({message: `cannot find user with ${id}`})
        }
        res.status(200).json(user);
    }
    catch(error){
      res.status(500).json({message: error.message});
    }
  })



  //get user
  app.get('/userss/:id', async(req, res) =>{
    try {
        const {id} = req.params;
        const user = await User.findById(id);
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({message: error.message})
    }
})

/*<-----------------------------------POST---------------------------------------------------------------------------->*/


// creating data 
app.post('/posts',  async(req, res)=>{   // after read operation it was changed to /posts. Earlier it was /post
  // console.log(req.body);
  // res.send(req.body);
  try{
 const post = await Post.create(req.body);
 res.status(200).json(post);
  } catch(error){
      console.log(error.message);
      res.status(500).json({message: error.message});
  }
})

/*<------------read op(fetching or getting all the data from the database)-------------------*/

// app.get('/posts', async(req, res) => {
//   try{
//   const posts = await Post.find({});
//   res.status(200).json(posts);
//   }catch(error){
//     res.status(500).json({message: error.message});
//   }
// })

/*<------------read op(fetching or getting the data from the database)-------------------  by id*/
 
app.get('/posts/:id', async (req, res) => {
  try {
     const { id } = req.params;
     const post = await Post.findById(id);
     
     if (!post) {
        return res.status(404).json({ message: 'Post not found' });
     }
     
     res.status(200).json(post);
  } catch (error) {
     res.status(500).json({ message: error.message });
  }
});








  /*----- Update data (edit data)-------- */
  app.put('/posts/:id' , async(req, res) => {
    try{
        const { id } = req.params;
        const post = await Post.findByIdAndUpdate(id, req.body);

      if(!post){
        return res.status(404).json({message: `cannot find any product with Id ${id}`});
      }
      const updatedPost = await Post.findById(id);
      res.status(200).json(updatedPost);

    }catch(error){
      res.status(500).json({message: error.message})
    }
  });

// /*----- Delete data -----------------*/

app.delete('/posts/:id' , async(req, res) =>{
  try{
      const { id } = req.params;
      const post = await Post.findByIdAndDelete(id);

      if(!post){
        return res.status(400).json({message: `cannot find any product with Id ${id}`});
      }
      res.status(200).json(post);

  }catch(error){ 
     res.status(500).json({message: error.message})
  }
});


/*************/
/*<------------read op(fetching or getting the data from the database)-------------------  based on a condition*/

/**Node.js Request query */
// app.get("/", async (req, res) => {
//   const username = req.query.user;
//   const catName = req.query.cat;
//   try {
//     let posts;
//     if (username) {
//       posts = await Post.find({ username });
//     } else if (catName) {
//       posts = await Post.find({
//         categories: { 
//           $in: [catName],
//         },
//       });
//     } else {
//       posts = await Post.find();
//     }
//     res.status(200).json(posts);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });


app.get('/posts', async (req, res) => {
  const username = req.query.user;
  const postId = req.query.postId || req.params.postId; // Include req.params.postId for direct URL

  try {
    let posts;

    if (postId) {
      const post = await Post.findById(postId);

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      return res.status(200).json(post);
    }

    if (username) {
      posts = await Post.find({ username });
    } else {
      posts = await Post.find();
    }

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});






/*******************categories */



app.post("/categories", async (req, res) => {
  try {
    const newCat = new Category(req.body);
    const savedCat = await newCat.save();
    res.status(201).json(savedCat);
  } catch (err) {
    res.status(500).json(err);
  }
});



app.get("/categories", async (req, res) => {
  try {
    const cats = await Category.find();
    res.status(200).json(cats);
  } catch (err) {
    res.status(500).json(err);
  }
});


/***********Node.js Upload file Rest api */



  module.exports= router;




