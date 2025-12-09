const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const admin = require('firebase-admin');

const serviceAccount = require('./blood-donation-applicati-fd3fb-firebase-adminsdk-fbsvc-6c42dc87bc.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;




// middelWear

app.use(cors());
app.use(express.json());

// verify token email;
const veryfiyToken = async (req, res, next) => {
  const autrization = req.headers.authorization;
  if (!autrization) {
   return res.status(401).send({message:'unauthrizaed access'})
  }
  const token = autrization.split(' ')[1];

  if (!token) {
   return  res.status(401).send({ message: 'unauthrizaed access' });
  }

  try {
    const decoded = await admin.auth().veryfiyToken(token);
    req.token_email = decoded.email;

    next()
    
  } catch  {
   return  res.status(401).send({ message: 'unauthrizaed access' });
  }
}


const uri = `mongodb+srv://${process.env.Bd_Name}:${process.env.Bd_Key}@cluster0.jkj46mi.mongodb.net/?appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


app.get('/', (req, res) => {
  res.send('blood donner server')
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const blood_donation = client.db('blood-server');
    const userInfo = blood_donation.collection('userInfo');


    // userInfo add  in the data base

    app.post('/user', async(req, res) => {
      const addUserInfo = req.body;
      addUserInfo.role = 'Donor';
      addUserInfo.status = 'Active';
      addUserInfo.createAt = new Date();

      const userEmail = req.body.email;

      const query = { email: userEmail };
      const oldeUser = await userInfo.findOne(query)

      if (oldeUser) {
        return res.send({message:'user alredy create'})
      }

      const result = await userInfo.insertOne(addUserInfo);
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log('Blood Doner',port)
})