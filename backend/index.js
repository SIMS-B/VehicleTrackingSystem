const express = require('express');
const app = express();
const user = require('./models/users')

// db connection
const knex = require('./database');

// const { Client } = require('pg');
 
// const connectDb = async () => {
//     try {
//         const client = new Client({
//             user: 'juwafsxqosjebt',
//             host: 'ec2-34-231-63-30.compute-1.amazonaws.com',
//             database: 'd6qp7gj6sg1pq1',
//             password: '8e63a48a2f7d76da3272ac5fbc737c9d1ae19f93ba39629748d2c444b3623aa3',
//             port: 5432
//         });
 
//         await client.connect()
//         const res = await client.query('SELECT * FROM public.users')
//         console.log(res)
//         await client.end()
//     } catch (error) {
//         console.log(error)
//     }
// }
 
// connectDb()

const connectDB = async () => {

    console.log("calling knex function");

}


const readUsers = async () => {
    const allUsers = await user.query(); 
    console.log(allUsers);
}

// db connection


const port = 8080;  // use process.eny.port

app.get('/', async (req, res) => {
    // res.send("Hello there!!");
    try
    {
        await connectDB();
        await readUsers();
        knex.destroy();
    } 
    catch (err)
    {
        console.log(err);
        knex.destroy();
    }

});

app.listen(port, (err) => {
    if (err) {
     console.error(err);
    }
     console.log(`server is listening on ${port}`);
});