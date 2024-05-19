const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;


// middleware

app.use(cors({
    origin: ['http://localhost:5000', 'https://harvest-hub-client.web.app', 'http://localhost:5173', 'https://harvest-hub-client.firebaseapp.com', 'https://harvest-hub-server-nine.vercel.app', 'http://localhost:5174'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.mj6vep2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

        // middleware
        const logger = async (req, res, next) => {
            console.log('called:', req.host, req.originalUrl)
            next();
        }
        const verifyToken = async (req, res, next) => {
            const token = req.cookies?.token;
            console.log('value of token in middleware', token);
            if (!token) {
                return res.status(401).send({ message: 'not authorized' });
            }
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
                //error
                if(err){
                    console.log(err)
                    return res.status(403).send({message: 'unauthorized'})
                }
                console.log('value in the token decoded', decoded)
                req.user = decoded;
                next();
            })
            
        };
async function run() {
    try {
        // ! Comment this line when deploy to vercel
        // await client.connect();

        // ? Collection ID
        const database = client.db("harvestFood");
        const foodCollection = database.collection("foods");
        const requestFoodCollection = database.collection("requestFood");

       

        //auth provider
        app.post('/jwt', logger, verifyToken, async (req, res) => {
            const user = req.body;
            console.log('user for token', user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
            .send({success: true})
        })

        //logout
        app.post('/logout',logger, verifyToken, async (req, res) => {
            const user = req.body;
            console.log('Logging Out', user);
            res.clearCookie('token', {maxAge:0}).send({success: true})
        })

        // harvest hub related api
        app.get('/allFood', logger, async (req, res) => {
            const cursor = foodCollection.find();
            const result = await cursor.toArray();
            res.send(result);

        });

        app.get('/foodDetails/:id', logger, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodCollection.findOne(query);
            res.send(result);
        });

        app.get('/myFood/:donatorEmail', logger, async (req, res) => {
            const donatorEmail = req.params.donatorEmail;
            const query = { donatorEmail: donatorEmail }; 
            const cursor = foodCollection.find(query);
            const results = await cursor.toArray();
            res.send(results);
        });

        app.get('/myRequestFood/:userEmail', async (req, res) => {
            const userEmail = req.params.userEmail;
            const query = { userEmail: userEmail };
            const cursor = requestFoodCollection.find(query);
            const results = await cursor.toArray();
            res.send(results);
        });

        app.put('/foodUpdate/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedFood = req.body;
            const food = {
                $set: {
                    foodName: updatedFood.foodName,
                    foodImage: updatedFood.foodImage,
                    foodStatus: updatedFood.foodStatus,
                    foodQuantity: updatedFood.foodQuantity,
                    pickupLocation: updatedFood.pickupLocation,
                    expiredDateTime: updatedFood.expiredDateTime,
                }
            }
            const result = await foodCollection.updateOne(filter, food, options);
            res.send(result);
        });
        app.put('/foodUpdateFoodStatus/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedFood = req.body;
            console.log(updatedFood);
            const food = {
                $set: {
                    foodStatus: updatedFood.foodStatus,
                }
            }
            const result = await foodCollection.updateOne(filter, food, options);
            res.send(result);
        });

        app.post('/addFood', async (req, res) => {
            const food = req.body;
            console.log('new food', food);
            const result = await foodCollection.insertOne(food);
            res.send(result);
        });
        app.post('/addRequestFood', async (req, res) => {
            const food = req.body;
            console.log('new request food', food);
            const result = await requestFoodCollection.insertOne(food);
            res.send(result);
        });

        app.delete('/foodDelete/:id',  async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodCollection.deleteOne(query);
            res.send(result);
        });



        // ! Comment this line when deploy to vercel
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Harvest Hub Server Is Running')
})

app.listen(port, () => {
    console.log(`Harvest Hub Server Is Running On Port ${port}`)
})