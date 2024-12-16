const express=require('express');
const bodyParser=require('body-parser');
const cors=require('cors');
const mongoose=require('mongoose');

const app=express();
const PORT=4000;

app.use(cors());
app.use(bodyParser.json());

const userRouter=require('./routes/userRouter');
const chatRouter=require('./routes/chatRouter');

app.use('/user',userRouter);
app.use('/chat',chatRouter);
mongoose.connect('mongodb://127.0.0.1:27017/yapyap', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

app.listen(PORT,()=>{
  console.log('Server is running on port:',PORT);
})



