import mongoose from 'mongoose';

export const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connect database success!');
    } catch (error) {
        console.log('Connect database error!');
    }
};
