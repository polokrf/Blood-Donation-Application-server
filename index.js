const express = require('express');
require('dotenv').config();
const cors = require('cors');
const stripe = require('stripe')(process.env.Payment);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const admin = require('firebase-admin');

// const serviceAccount = require('./blood-donation-applicati-fd3fb-firebase-adminsdk-fbsvc-6c42dc87bc.json');

// const serviceAccount = require("./firebase-admin-key.json");

const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8');
const serviceAccount = JSON.parse(decoded);


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


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
    const decoded = await admin.auth().verifyIdToken(token);
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
function generateTrackingId() {
  const prefix = 'PZ'; // your brand or project short code
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `${prefix}-${date}-${random}`;
}



app.get('/', (req, res) => {
  res.send('blood donner server')
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const blood_donation = client.db('blood-server');
    const userInfo = blood_donation.collection('userInfo');
    const donationInfo = blood_donation.collection('donationInfo');
    const foundInfo = blood_donation.collection('foundInfo');
    const fedBack = blood_donation.collection('fedBacks');

    // admin middle wear
    const adminVeryfiyRole = async (req, res, next) => {
      const email = req.token_email;
      const query = { email };
      const users = await userInfo.findOne(query);

      if (!users || users?.role !== 'Admin') {
        return res.status(403).send({ message: 'forbiden access' });
      }
      next();
    };
    // admin or volunteer middle wear
    const adminORVolunteerVeryfiyRole = async (req, res, next) => {
      const email = req.token_email;
      const query = { email };
      const users = await userInfo.findOne(query);

      if (!users || (users?.role !== 'Admin' && users?.role !== 'Volunteer')) {
        return res.status(403).send({ message: 'forbiden access' });
      }
      next();
    };

    // get user role clint side

    app.get('/users/:email/role', veryfiyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const users = await userInfo.findOne(query);

      res.send({ role: users?.role || 'Donor' });
    });

    // get all user info admin request
    app.get('/all-users',veryfiyToken,adminVeryfiyRole,  async (req, res) => {
      const { status, limit, skip } = req.query;
      
      
      const query = {};
      if (status) {
        query.status=status
      }
      const cursor = userInfo.find(query)
        .limit(Number(limit))
        .skip(Number(skip));
      const result = await cursor.toArray();
      const count = await userInfo .countDocuments(query)
        
      
     
      res.send(  {result, dataCount:count});
    });

    // user profile only own data
    app.get('/my-profile-data', veryfiyToken, async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        if (!req.token_email) {
          return res.status(403).send({ message: ' forbiden access' });
        }
        query.email = email;
      }
      const result = await userInfo.findOne(query);

      res.send(result);
    });

    // userInfo add  in the data base
    app.post('/user', async (req, res) => {
      const addUserInfo = req.body;
      addUserInfo.role = 'Donor';
      addUserInfo.status = 'Active';
      addUserInfo.createAt = new Date();

      const userEmail = req.body.email;

      const query = { email: userEmail };
      const oldeUser = await userInfo.findOne(query);

      if (oldeUser) {
        return res.send({ message: 'user alredy create' });
      }

      const result = await userInfo.insertOne(addUserInfo);
      res.send(result);
    });

    // users update profile
    app.patch('/user-update-profile/:id', veryfiyToken, async (req, res) => {
      const id = req.params.id;
      const updateUserInfo = req.body;
      const blood_group= updateUserInfo.blood_group.toUpperCase()
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {...updateUserInfo, blood_group},
      };

      const result = await userInfo.updateOne(query, update);
      res.send(result);
    });

    // users role update
    app.patch('/user-role/:id',veryfiyToken,adminVeryfiyRole,async (req, res) => {
        const id = req.params.id;
        const updateRole = req.body.role;
        const query = { _id: new ObjectId(id) };
        const update = {
          $set: { role: updateRole },
        };

        const result = await userInfo.updateOne(query, update);
        res.send(result);
      }
    );

    // update status
    app.patch(
      '/user-status/:id',
      veryfiyToken,
      adminVeryfiyRole,
      async (req, res) => {
        const id = req.params.id;
        const updateStatus = req.body.status;
        const query = { _id: new ObjectId(id) };
        const update = {
          $set: { status: updateStatus },
        };

        const result = await userInfo.updateOne(query, update);
        res.send(result);
      }
    );

    // Admin all donation-request
    app.get('/all-blood-donation-request', veryfiyToken, adminORVolunteerVeryfiyRole, async (req, res) => {
      
        const { status ,limit,skip} = req.query;
        const query = {};
        if (status) {
          query.status=status
        }
        const cursor = donationInfo
          .find(query)
          .limit(Number(limit))
          .skip(Number(skip));
      const result = await cursor.toArray();
      const count = await donationInfo.countDocuments(query);
        res.send({ result ,countData:count});
      }
    );

    // my blood donation request get request

    app.get('/my-donation-request', veryfiyToken, async (req, res) => {
      const {email,status,limit,skip }= req.query;
      
      const query = {};
      if (email) {
        if (!req.token_email) {
          return res.status(403).send({ message: ' forbiden access' });
        }
        query.requester_email = email;
        if (status) {
          query.status = status;
       }
      }
      const cursor = donationInfo.find(query).limit(Number(limit)).skip(Number(skip));
      const result = await cursor.toArray();
      const count = await donationInfo.countDocuments(query);
      res.send({ result ,countData:count});
    });
    // recent donation request
    app.get('/recent-donation', veryfiyToken, async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        if (!req.token_email) {
          return res.status(403).send({ message: ' forbiden access' });
        }
        query.requester_email = email;
      }
      const cursor = donationInfo.find(query).sort({ createAt: -1 }).limit(3);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/one-donationInfo/:id',  async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await donationInfo.findOne(query);
      res.send(result);
    });

    // all pending donation req

    app.get('/pending-donation', async (req, res) => {
      const{status,limit,skip} = req.query;
      const query = { status };
      const cursor = donationInfo.find(query).limit(Number(limit)).skip(Number(skip));
      const result = await cursor.toArray();
      const count = await donationInfo.countDocuments(query);
      res.send({ result ,countData:count});
    });

    // blood donation post request
    app.post('/blood-donation', veryfiyToken, async (req, res) => {
      const newDonation = req.body;
      newDonation.status = 'pending';
      newDonation.createAt = new Date();
      // find block user
      const requesterEmail = req.body.requester_email;
      const query = { email: requesterEmail };
      const findBlockUser = await userInfo.findOne(query);

      if (!findBlockUser || findBlockUser.status === 'Blocked') {
        return res.send({ message: 'you are blocked plz do not try again' });
      }

      const result = await donationInfo.insertOne(newDonation);
      res.send(result);
    });

    // blood donation update

    app.patch('/update-data/:id', veryfiyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateData = req.body;
      const update = {
        $set: updateData,
      };
      const result = await donationInfo.updateOne(query, update);
      res.send(result);
    });

    // donation status update
    app.patch('/update-status/:id',veryfiyToken,async (req, res) => {
      const id = req.params.id;
      const updateValue = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          status: updateValue.status,
          donor_email: updateValue.email,
          donor_name: updateValue.name,
        },
      };
      const result = await donationInfo.updateOne(query, update);
      res.send(result);
    });

    // only done accapet status update
    app.patch('/only-status-update/:id', veryfiyToken, async (req, res) => {
      const id = req.params.id;
      const updateStatus = req.body.status;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          status: updateStatus,
        },
      };
      const result = await donationInfo.updateOne(query, update);
      res.send(result);
    });

    // blood donation delete request
    app.delete('/delete-donation/:id', veryfiyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await donationInfo.deleteOne(query);
      res.send(result);
    });

    // found info
    
    app.get('/fund-user', veryfiyToken, async (req, res) => {
      const { sort = 'amount_total', order, limit, skip } = req.query;
      const sortQuery = {};
      if (order) {
        sortQuery[sort || 'amount_total'] = order === 'asc' ? 1 : -1;
      }
      const cursor = foundInfo.find()
        .sort(sortQuery)
        .limit(Number(limit))
        .skip(Number(skip));

      const result = await cursor.toArray();
      const count = await foundInfo.countDocuments()
      res.send({ count, result });
    })


    // payment info
    app.post('/create-checkout-session', veryfiyToken, async (req, res) => {
      const paymentInfo = req.body;
      const amount = parseInt(paymentInfo.amount * 100);
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: 'USD',
              unit_amount: amount,

              product_data: {
                name: paymentInfo.name,
              },
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer_email: paymentInfo.email,
        metadata: {
          founderName: paymentInfo.name,
          email: paymentInfo.email,
        },
        success_url: `${process.env.Bd_Clint}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.Bd_Clint}/dashboard/payment-canceled`,
      });

      res.send({ url: session.url });
    });

    app.post('/paymentInfo', veryfiyToken, async (req, res) => {
      const sessionId = req.query.session_id;
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      

       const transactionId = session.payment_intent;
       const query = { transaction: transactionId };
       const findUsers = await foundInfo.findOne(query);

       if (findUsers) {
         return res.send({ message: 'No duplicate' });
       }

      if (session.payment_status === 'paid') {
        const TrackingId = generateTrackingId();
        const totalAmount = parseInt(session.amount_total / 100);
        const date = new Date();
        const info = {
          transaction: session.payment_intent,
          name: session.metadata.founderName,
          email: session.customer_email,
          crd_own_name: session.name,
          country: session.country,
          amount_total: totalAmount,
          paymentAt: date,
          TrackingId,
        };

       
        const saveInfo = await foundInfo.insertOne(info);
        res.send({
          transactionId: session.payment_intent,
          TrackingId,
          saveInfo,
        });
      }
    });

    // search donor
    app.get('/search', async (req, res) => {
      const data = req.query
      
     

       const query = {role:'Donor',status:'Active'};

      if (data) {
        query.$or = [
         {blood_group:{ $regex: data.blood_group, $options: 'i' }},
         {district:{ $regex: data.district, $options: 'i' }},
         {upazaila:{ $regex: data.upazaila, $options: 'i' }}
       ]
     }
       
      const cursor = userInfo.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/dashboard-stats',async (req, res) => {
      const role = 'Donor';
      const query = { role };
      const allDonor = await userInfo.countDocuments(query);
      const allBloodDonation = await donationInfo.countDocuments();
      const pipeline = [{
        $group: {
          _id: null,
          total : {$sum:'$amount_total'}
        }
      }];
      
      const totalAmount = await foundInfo.aggregate(pipeline).toArray();
      res.send({donor:allDonor,request:allBloodDonation,totalAmount})
    });

    // fedBack  Data

    app.get('/fedBack', async (req, res) => {
      const result = await fedBack.find().toArray();
      res.send(result)
    })

    app.post('/fedBack', async (req, res) => {
      const fedBackData = req.body;
      const result = await fedBack.insertOne(fedBackData);
      res.send(result);
    })

    // // Send a ping to confirm a successful connection
    // await client.db('admin').command({ ping: 1 });
    // console.log(
    //   'Pinged your deployment. You successfully connected to MongoDB!'
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log('Blood Doner',port)
})