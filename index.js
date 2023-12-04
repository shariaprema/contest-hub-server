require('dotenv').config()
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require("cors");
// var jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.socuaah.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const contestsCollection = client.db("contestHub").collection("contests");
    // const advertisesCollection = client.db("contestHub").collection("advertises");
    const paymentCollection = client.db("contestHub").collection("payments");
    const cartCollection = client.db("contestHub").collection("carts");
    const userCollection = client.db("contestHub").collection("users");

    //JWT related API:

  // app.post('/jwt', async(req,res)=>{
  //   const user = req.body
  //   const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn: '1h'})
  //   res.send({token})
  // })


  //       const verifyToken = (req,res,next)=>{
  //   console.log('inside verify token',req.headers.authorization)
  //   if(!req.headers.authorization){
  //     return res.status(401).send({message: 'Unauthorized Access'})
  //   }

  //    const token = req.headers.authorization.split(' ')[1]
  //   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{

  //     if(err){
  //       return res.status(401).send({message: 'Unauthorized Access'})

  //     }

  //     req.decoded=decoded;
  //    next()
  //   })


  // }







  // user Collection :
    //  for signUp 
      app.get("/users", async(req,res)=>{
        // console.log(req.headers);
        const result = await userCollection.find().toArray()
        res.send(result)
  
      })

      // for admin role set up
      app.get('/users/admin/:email', async(req,res) =>{
      const email = req.params.email
    
      const query = {email: email}
      const user = await userCollection.findOne(query)
      let admin = false
      if(user){
        admin = user?.role === 'admin';
      }
      res.send({admin})
    })

// for contestCreator role set up
      app.get('/users/contestCreator/:email', async(req,res) =>{
      const email = req.params.email
     
      const query = {email: email}
      const user = await userCollection.findOne(query)
      let contestCreator = false
      if(user){
        contestCreator = user?.role === 'contestCreator';
      }
      res.send({contestCreator})
    })




   app.post("/users", async(req,res)=>{
      const user = req.body;
      const query = {email: user?.email}
      const existingUser = await userCollection.findOne(query)
      if(existingUser){
       return res.send({message: 'User Already Exist', insertedId: null})
      }
      const result = await userCollection.insertOne(user);
      console.log(result);
      res.send(result);

    })
//----------


   app.patch('/users/admin/:id',async (req, res) =>{
      const id = req.params.id
      const filter = {_id: new ObjectId(id)}
      const updatedDoc ={
        $set:{
          role:'admin'
        }
      }
      const result = await userCollection.updateOne(filter,updatedDoc)
      res.send(result)
    })

  
   app.patch('/users/contestCreator/:id',async (req, res) =>{
      const id = req.params.id
      const filter = {_id: new ObjectId(id)}
      const updatedDoc ={
        $set:{
          role:'contestCreator'
        }
      }
      const result = await userCollection.updateOne(filter,updatedDoc)
      res.send(result)
    })

    app.get("/users/:email", async(req,res)=>{
      const email = req.params.email
      const result = await userCollection.findOne(email)
      res.send(result)

    })







 // contests related API
    app.get('/contests', async(req,res)=>{
       const email = req.query.email
      const query = {email: email}
      const result = await contestsCollection.find(query).toArray();
      res.send(result)
    })

    // for all contest routing......PROBLEM TODO
    app.get('/contests', async(req,res)=>{
      const id = req.params.id
      const result = await contestsCollection.find(query).toArray();
      res.send(result)
    })



 
    app.post("/contests", async(req,res)=>{
      const item = req.body
      const result = await contestsCollection.insertOne(item)
      res.send(result)
    })
      

  app.get("/contests/:id", async (req, res) => {
      const id = req.params.id
      const query = {
        _id: new ObjectId(id) 
      }
      const result = await contestsCollection.findOne(query);
      res.send(result);
    });

   app.delete('/contests/:id',async (req, res) =>{
      const id= req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await contestsCollection.deleteOne(query)
      res.send(result)
    })





    // payment related API:
      app.post("/create-payment-intent", async (req, res) =>{
        const { price } = req.body;
        const amount = parseInt(price * 100)
        console.log(amount,'inside the intend amount.......')

        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "usd",
          payment_method_types: [
            "card"
          ],
        })

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    })




    app.post('/payments', async (req,res)=>{
    const payment = req.body;
    const paymentResult = await paymentCollection.insertOne(payment)

    // carefully delete each item from the cart
    // console.log('payment info', payment );
    // const query = { 
    //   _id: {
    //     $in: payment.cartIds.map(id=> new ObjectId(id))
    //   }}

    // const deleteResult = await cartCollection.deleteMany(query)

    // res.send({paymentResult,deleteResult})
   
    res.send(paymentResult)

  })


  app.get('/payments/:email', async (req,res)=>{
    const query= {email: req.params.email};
    
    const result = await paymentCollection.find(query).toArray();
    res.send(result)
  })




  // Cart Realted API

   app.get("/carts", async(req,res)=>{
      const email = req.query.email
      const query = {email: email}
      const result = await cartCollection.find(query).toArray()
      res.send(result)
    })




  app.post('/carts', async (req, res) => {
    const cartItems = req.body;
    const result = await cartCollection.insertOne(cartItems);
    console.log(result);
    res.send(result);
  });




  

    




















    // Send a ping to confirm a successful connection

    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get("/", (req, res) => {
    res.send("ContestHub is running...");
  });


  app.listen(port, () => {
    console.log(`ContestHub Running on port ${port}`);
  });