import mongoose from 'mongoose';

// MongoDB connection string
const MONGODB_URI = "mongodb+srv://kmass8754:karthick877@karthicktask.bbjj1ye.mongodb.net/actech";

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useCreateIndex: true,
});

const db = mongoose.connection;

// Event handling for successful connection
db.on('connected', () => {
    console.log('Connected to MongoDB');
});

// Event handling for connection error
db.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

export default db;
