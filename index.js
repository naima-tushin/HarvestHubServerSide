const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(cors({
    origin: ["http://localhost:5000",]
  }));
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.mj6vep2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // ! Comment this line when deploy to vercel
        await client.connect();

        // ? Collection ID
        const database = client.db("harvestFood");
        const foodCollection = database.collection("foods");
        const requestFoodCollection = database.collection("requestFood");
         

        app.get('/allFood', async (req, res) => {
            const cursor = foodCollection.find();
            const result = await cursor.toArray();
            res.send(result);

        });

        app.get('/foodDetails/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodCollection.findOne(query);
            res.send(result);
        });

        app.get('/myFood/:donatorEmail', async (req, res) => {
            const donatorEmail = req.params.donatorEmail;
            const query = { donatorEmail: donatorEmail }; // Assuming 'userEmail' is the field name
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
            const filter = { _id: new ObjectId(id)}
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

        app.delete('/foodDelete/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodCollection.deleteOne(query);
            res.send(result);
        });


       
        // ! Comment this line when deploy to vercel
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }  finally {
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