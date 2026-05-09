const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const AdminUser = require('../models/AdminUser');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const existingAdmin = await AdminUser.findOne({ username: 'admin' });
    
    if (!existingAdmin) {
      await AdminUser.create({
        username: 'admin',
        email: 'admin@cem-dz.com',
        password: 'admin123',
        fullName: 'Administrateur',
        userType: 1
      });
      console.log('✅ Admin user created: username=admin, password=admin123');
    } else {
      console.log('⚠️ Admin user already exists');
    }
    
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createAdmin();