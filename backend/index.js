const express = require('express');
const app = express();

const port = 8080;  // use process.eny.port

app.get('/', (req, res) => {
    res.send("Hello there!!");

});

app.listen(port, (err) => {
    if (err) {
     console.error(err);
    }
     console.log(`server is listening on ${port}`);
});