const express = require('express')
const cors = require('cors')
const dotenv=require("dotenv")

dotenv.config();

const mainrouter = require('./routes/mainroutes')
const app = express();
app.use(cors({
    origin: 'http://127.0.0.1:5500',
    credentials: true 
}));

app.use(express.json())

app.use('/api/v1', mainrouter)

app.listen(3000, () => {
console.log("Application is running fine")
    return "application is working fine"
})