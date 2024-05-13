const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
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
         

        app.get('/allFood', async (req, res) => {
            const cursor = foodCollection.find();
            const result = await cursor.toArray();
            res.send(result);

        });

        app.post('/addFood', async (req, res) => {
            const food = req.body;
            console.log('new food', food);
            const result = await foodCollection.insertOne(food);
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