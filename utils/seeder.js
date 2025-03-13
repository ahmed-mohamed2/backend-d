const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Trainee = require('../models/Trainee');
const Plan = require('../models/Plan');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    phone: '01234567890',
    gender: 'male',
    age: 35,
    role: 'admin',
  },
  {
    name: 'Trainer 1',
    email: 'trainer1@example.com',
    password: 'password123',
    phone: '01234567891',
    gender: 'male',
    age: 30,
    role: 'trainer',
  },
  {
    name: 'Trainer 2',
    email: 'trainer2@example.com',
    password: 'password123',
    phone: '01234567892',
    gender: 'female',
    age: 28,
    role: 'trainer',
  },
  {
    name: 'Trainee 1',
    email: 'trainee1@example.com',
    password: 'password123',
    phone: '01234567893',
    gender: 'male',
    age: 25,
    role: 'trainee',
  },
  {
    name: 'Trainee 2',
    email: 'trainee2@example.com',
    password: 'password123',
    phone: '01234567894',
    gender: 'female',
    age: 22,
    role: 'trainee',
  },
];

const plans = [
  {
    nameAr: 'خطة المبتدئين',
    nameEn: 'Beginner Plan',
    descriptionAr: 'خطة مثالية للمبتدئين لتعلم أساسيات القيادة',
    descriptionEn: 'Perfect plan for beginners to learn driving basics',
    price: 1000,
    numberOfSessions: 10,
    duration: 50,
    category: 'beginner',
    features: [
      {
        textAr: 'تعلم أساسيات القيادة',
        textEn: 'Learn driving basics',
      },
      {
        textAr: 'القيادة في الطرق الفرعية',
        textEn: 'Driving on secondary roads',
      },
      {
        textAr: 'تعلم قواعد المرور الأساسية',
        textEn: 'Learn basic traffic rules',
      },
    ],
    isActive: true,
  },
  {
    nameAr: 'خطة متوسطة',
    nameEn: 'Intermediate Plan',
    descriptionAr: 'للسائقين الذين لديهم معرفة أساسية بالقيادة',
    descriptionEn: 'For drivers with some basic driving knowledge',
    price: 1500,
    numberOfSessions: 8,
    duration: 60,
    category: 'intermediate',
    features: [
      {
        textAr: 'القيادة في الطرق السريعة',
        textEn: 'Highway driving',
      },
      {
        textAr: 'المناورات المتقدمة',
        textEn: 'Advanced maneuvers',
      },
      {
        textAr: 'القيادة في الظروف المختلفة',
        textEn: 'Driving in different conditions',
      },
    ],
    isActive: true,
  },
  {
    nameAr: 'خطة متقدمة',
    nameEn: 'Advanced Plan',
    descriptionAr: 'للسائقين ذوي الخبرة الذين يريدون تحسين مهاراتهم',
    descriptionEn: 'For experienced drivers who want to improve their skills',
    price: 2000,
    numberOfSessions: 5,
    duration: 90,
    category: 'advanced',
    features: [
      {
        textAr: 'تقنيات القيادة المتقدمة',
        textEn: 'Advanced driving techniques',
      },
      {
        textAr: 'القيادة الدفاعية',
        textEn: 'Defensive driving',
      },
      {
        textAr: 'القيادة في ظروف صعبة',
        textEn: 'Driving in difficult conditions',
      },
    ],
    isActive: true,
  },
];

// Import data
const importData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Trainer.deleteMany();
    await Trainee.deleteMany();
    await Plan.deleteMany();

    // Hash passwords
    const hashedUsers = users.map(user => {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(user.password, salt);
      return {
        ...user,
        password: hashedPassword,
      };
    });

    // Create users
    const createdUsers = await User.insertMany(hashedUsers);

    // Get specific users
    const adminUser = createdUsers[0]._id;
    const trainer1 = createdUsers[1]._id;
    const trainer2 = createdUsers[2]._id;
    const trainee1 = createdUsers[3]._id;
    const trainee2 = createdUsers[4]._id;

    // Create trainers
    const createdTrainers = await Trainer.insertMany([
      {
        user: trainer1,
        status: 'active',
        hasVehicle: true,
        vehicleType: 'Sedan',
        vehicleModel: 'Toyota Corolla',
        vehicleYear: 2020,
        specializations: ['Beginner', 'Defensive Driving'],
      },
      {
        user: trainer2,
        status: 'active',
        hasVehicle: true,
        vehicleType: 'Hatchback',
        vehicleModel: 'Honda Fit',
        vehicleYear: 2021,
        specializations: ['Advanced', 'Highway Driving'],
      },
    ]);

    // Create trainees
    await Trainee.insertMany([
      {
        user: trainee1,
        assignedTrainer: createdTrainers[0]._id,
        preferredLanguage: 'en',
      },
      {
        user: trainee2,
        assignedTrainer: createdTrainers[1]._id,
        preferredLanguage: 'ar',
      },
    ]);

    // Create plans
    await Plan.insertMany(plans);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

// Delete data
const destroyData = async () => {
  try {
    await User.deleteMany();
    await Trainer.deleteMany();
    await Trainee.deleteMany();
    await Plan.deleteMany();

    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

// Check command line arg
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
