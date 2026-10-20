import 'dotenv/config';
import mongoose from 'mongoose';
import Project from './models/Project.js';
import SiteSettings from './models/SiteSettings.js';
import { seedProjects, defaultSettings } from './seedData.js';

async function seed() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing. Copy server/.env.example to server/.env first.');
  await mongoose.connect(process.env.MONGO_URI);
  const count = await Project.countDocuments();
  if (count === 0) {
    await Project.insertMany(seedProjects);
    console.log(`Seeded ${seedProjects.length} portfolio projects.`);
  } else {
    console.log(`Seed skipped: ${count} project(s) already exist.`);
  }
  await SiteSettings.findOneAndUpdate({ key: 'main' }, { $setOnInsert: defaultSettings }, { upsert: true, new: true });
  await mongoose.disconnect();
}

seed().catch(error => { console.error('Seed failed:', error.message); process.exitCode = 1; });
