import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
}

// import modules, prefer to import after this to make sure
// environment variables are loaded for the imported modules

// add your code here