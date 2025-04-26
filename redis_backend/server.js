require("dotenv").config();
const redis = require('redis');
const express = require("express");
const jwt = require("jsonwebtoken");
const { createClient } = require("redis");
const bcrypt = require("bcrypt");
const cors = require("cors");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const bodyParser = require('body-parser');
const csv = require('csv-parser');
const app = express();  


// Multer configuration for file uploads
const upload = multer({ dest: "uploads/" });

// ✅ CORS Configuration
const corsOptions = {
  origin: "http://localhost:3001", // ✅ Allow only your frontend
  credentials: true, // ✅ Allow credentials (cookies, authorization headers)
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json()); // ✅ Use JSON body parser
app.use(express.urlencoded({ extended: true }));


// ✅ Connect to Redis
const redisClient = createClient();
redisClient.on("error", (err) => console.error("❌ Redis error:", err));

(async () => {
  try {
    await redisClient.connect();
    console.log("✅ Connected to Redis.");
    await createDefaultUsers();
  } catch (err) {
    console.error("❌ Redis connection failed:", err);
  }
})();

const JWT_SECRET = process.env.JWT_SECRET || "admin123";
const MAX_BARANGAY_OFFICERS = 20;
const MAX_RESIDENTS = 20;

const createDefaultUsers = async () => {
  try {
    console.log("🔍 Checking if default users exist...");

    // Define default users
    const defaultUsers = {
      admin: {
        username: "admin",
        password: "admin123", // ⚠️ Consider hashing later for security
        role: "admin",
      },
      resident: {
        username: "resident",
        password: "resident123",
        role: "resident",
      },
      officer: {
        username: "officer",
        password: "officer123",
        role: "officer",
      },
    };

    for (const [key, userData] of Object.entries(defaultUsers)) {
      const userExists = await redisClient.hExists("users", key);

      if (!userExists) {
        await redisClient.hSet("users", key, JSON.stringify(userData));
        console.log(`✅ Default ${key} created: Username: ${userData.username}, Password: ${userData.password}`);
      } else {
        console.log(`✅ ${key} already exists, but ensuring correct format...`);

        const existingData = await redisClient.hGet("users", key);

        try {
          JSON.parse(existingData); // Try parsing
        } catch (error) {
          console.log(`❌ Incorrect format detected for ${key}. Fixing data...`);
          await redisClient.hSet("users", key, JSON.stringify(userData));
          console.log(`✅ ${key} data format fixed!`);
        }
      }
    }
  } catch (err) {
    console.error("❌ Error creating/fixing default users:", err);
  }
};

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Retrieve user data from Redis
    const userData = await redisClient.hGet("users", username);

    if (!userData) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    let user;
    try {
      user = JSON.parse(userData); // ✅ Parse only valid JSON
    } catch (error) {
      console.error("❌ Invalid JSON format in Redis for user:", username, "| Data:", userData);
      return res.status(500).json({ message: "Server error: Invalid user data format" });
    }

    // Check password (⚠️ Only for testing, no hashing)
    if (password !== user.password) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate JWT token
    const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "1h" });

    console.log("✅ Login successful:", username);
    res.json({ message: "Login successful", role: user.role, token });

  } catch (err) {
    console.error("❌ Internal Server Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

const RESIDENT_ID_KEY = "resident_id"; // To increment resident IDs
const RESIDENTS_HASH_KEY = "residents"; // Hash key for storing residents

app.get("/residents", async (req, res) => {
  try {
    const keys = await redisClient.keys("resident:*"); // ✅ Get all resident keys

    const residents = [];
    for (const key of keys) {
      const resident = await redisClient.hGetAll(key);
      residents.push(resident);
    }

    res.json(residents);
  } catch (err) {
    console.error("❌ Error fetching residents:", err);
    res.status(500).json({ message: "Failed to fetch residents" });
  }
});


// Route to save resident data
app.post("/add-resident", async (req, res) => {
  const { id, firstName, lastName, middleInitial, street, purok, gender, age, birthDate, birthPlace, barangay,
          citizenship, civilStatus, religion, occupation, email, contactNumber, annualIncome, beneficiaryStatus, status } = req.body;

  // Validate required fields
  if (!id || !firstName || !lastName) {
    return res.status(400).json({ message: 'Missing required fields: ID, First Name, Last Name' });
  }

  try {
    // Store each field individually in Redis
    const residentData = {
      id: id,
      firstName: firstName,
      middleInitial: middleInitial || 'N/A',  // If no middle initial, set to 'N/A'
      lastName: lastName,
      street: street || 'N/A',
      purok: purok || 'N/A',
      gender: gender || 'N/A',
      age: age || 'N/A',
      birthDate: birthDate || 'N/A',
      birthPlace: birthPlace || 'N/A',
      barangay: barangay || 'N/A',
      citizenship: citizenship || 'N/A',
      civilStatus: civilStatus || 'N/A',
      religion: religion || 'N/A',
      occupation: occupation || 'N/A',
      email: email || 'N/A',
      contactNumber: contactNumber || 'N/A',
      annualIncome: annualIncome || 'N/A',
      beneficiaryStatus: beneficiaryStatus || 'N/A',
      status: status || 'Active'
    };

    // Save each field individually in Redis hash
    await redisClient.hSet(`resident:${id}`, 'id', residentData.id);
    await redisClient.hSet(`resident:${id}`, 'firstName', residentData.firstName);
    await redisClient.hSet(`resident:${id}`, 'middleInitial', residentData.middleInitial);
    await redisClient.hSet(`resident:${id}`, 'lastName', residentData.lastName);
    await redisClient.hSet(`resident:${id}`, 'street', residentData.street);
    await redisClient.hSet(`resident:${id}`, 'purok', residentData.purok);
    await redisClient.hSet(`resident:${id}`, 'gender', residentData.gender);
    await redisClient.hSet(`resident:${id}`, 'age', residentData.age);
    await redisClient.hSet(`resident:${id}`, 'birthDate', residentData.birthDate);
    await redisClient.hSet(`resident:${id}`, 'birthPlace', residentData.birthPlace);
    await redisClient.hSet(`resident:${id}`, 'barangay', residentData.barangay);
    await redisClient.hSet(`resident:${id}`, 'citizenship', residentData.citizenship);
    await redisClient.hSet(`resident:${id}`, 'civilStatus', residentData.civilStatus);
    await redisClient.hSet(`resident:${id}`, 'religion', residentData.religion);
    await redisClient.hSet(`resident:${id}`, 'occupation', residentData.occupation);
    await redisClient.hSet(`resident:${id}`, 'email', residentData.email);
    await redisClient.hSet(`resident:${id}`, 'contactNumber', residentData.contactNumber);
    await redisClient.hSet(`resident:${id}`, 'annualIncome', residentData.annualIncome);
    await redisClient.hSet(`resident:${id}`, 'beneficiaryStatus', residentData.beneficiaryStatus);
    await redisClient.hSet(`resident:${id}`, 'status', residentData.status);

    res.status(201).json({ message: 'Resident added successfully' });
  } catch (error) {
    console.error('Error saving resident:', error);
    res.status(500).json({ message: 'Failed to save resident' });
  }
});


// ✅ Corrected Update Resident API
app.put("/update-resident/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const residentKey = `resident:${id}`;

    // Check if resident exists
    const residentExists = await redisClient.hExists(residentKey, 'id');
    if (!residentExists) {
      return res.status(404).json({ message: "Resident not found" });
    }

    // ✅ Update each field individually (fixes issue)
    const updatedFields = req.body;
    for (const [key, value] of Object.entries(updatedFields)) {
      await redisClient.hSet(residentKey, key, value);
    }

    console.log(`✅ Resident ${id} updated successfully.`);
    res.json({ message: "Resident updated", updatedResident: updatedFields });
  } catch (err) {
    console.error("❌ Error updating resident:", err);
    res.status(500).json({ message: "Failed to update resident", error: err.message });
  }
});



// Delete a resident
app.delete("/delete-resident/:id",  async (req, res) => {
  try {
    const { id } = req.params;
    const residentKey = `resident:${id}`;

    // Check if the resident exists before deletion
    const residentExists = await redisClient.hExists(residentKey, 'id');
    if (!residentExists) {
      return res.status(404).json({ message: "Resident not found" });
    }

    // Delete the resident data from Redis
    await redisClient.del(residentKey);
    console.log(`✅ Resident ${id} deleted successfully.`);
    
    res.json({ message: "Resident deleted" });
  } catch (err) {
    console.error("❌ Error deleting resident:", err);
    res.status(500).json({ message: "Failed to delete resident", error: err.message });
  }
});

// Route to save officer data
app.post('/add-officer', async (req, res) => {
  const { id, firstName, lastName, middleInitial, position, street, purok, gender, age, birthDate, birthPlace, 
    citizenship, civilStatus, religion, occupation, email, contactNumber, role, annualIncome, beneficiaryStatus, status } = req.body;

  // Validate required fields
  if (!id || !firstName || !lastName) {
    return res.status(400).json({ message: 'Missing required fields: ID, First Name, Last Name' });
  }

  try {
    // Set officer data
    const officerData = {
      id: id,
      firstName: firstName,
      middleInitial: middleInitial || 'N/A',  // If no middle initial, set to 'N/A'
      lastName: lastName,
      position: position || 'N/A',
      street: street || 'N/A',
      purok: purok || 'N/A',
      gender: gender || 'N/A',
      age: age || 'N/A',
      birthDate: birthDate || 'N/A',
      birthPlace: birthPlace || 'N/A',
      citizenship: citizenship || 'N/A',
      civilStatus: civilStatus || 'N/A',
      religion: religion || 'N/A',
      occupation: occupation || 'N/A',
      email: email || 'N/A',
      contactNumber: contactNumber || 'N/A',
      role: role || 'N/A',
      annualIncome: annualIncome || 'N/A',
      beneficiaryStatus: beneficiaryStatus || 'N/A',
      status: status || 'Active'
    };

    // Save each field individually in Redis hash (similar to how resident fields are saved)
    await redisClient.hSet(`officer:${id}`, 'id', officerData.id);
    await redisClient.hSet(`officer:${id}`, 'firstName', officerData.firstName);
    await redisClient.hSet(`officer:${id}`, 'middleInitial', officerData.middleInitial);
    await redisClient.hSet(`officer:${id}`, 'lastName', officerData.lastName);
    await redisClient.hSet(`officer:${id}`, 'position', officerData.position);
    await redisClient.hSet(`officer:${id}`, 'street', officerData.street);
    await redisClient.hSet(`officer:${id}`, 'purok', officerData.purok);
    await redisClient.hSet(`officer:${id}`, 'gender', officerData.gender);
    await redisClient.hSet(`officer:${id}`, 'age', officerData.age);
    await redisClient.hSet(`officer:${id}`, 'birthDate', officerData.birthDate);
    await redisClient.hSet(`officer:${id}`, 'birthPlace', officerData.birthPlace);
    await redisClient.hSet(`officer:${id}`, 'citizenship', officerData.citizenship);
    await redisClient.hSet(`officer:${id}`, 'civilStatus', officerData.civilStatus);
    await redisClient.hSet(`officer:${id}`, 'religion', officerData.religion);
    await redisClient.hSet(`officer:${id}`, 'occupation', officerData.occupation);
    await redisClient.hSet(`officer:${id}`, 'email', officerData.email);
    await redisClient.hSet(`officer:${id}`, 'contactNumber', officerData.contactNumber);
    await redisClient.hSet(`officer:${id}`, 'role', officerData.role);
    await redisClient.hSet(`officer:${id}`, 'annualIncome', officerData.annualIncome);
    await redisClient.hSet(`officer:${id}`, 'beneficiaryStatus', officerData.beneficiaryStatus);
    await redisClient.hSet(`officer:${id}`, 'status', officerData.status);

    res.status(201).json({ message: 'Officer added successfully' });
  } catch (error) {
    console.error('Error saving officer:', error);
    res.status(500).json({ message: 'Failed to save officer' });
  }
});


//Fetch officers
app.get("/officers", async (req, res) => {
  try {
    const keys = await redisClient.keys("officer:*");
    const officers = [];

    for (const key of keys) {
      const officer = await redisClient.hGetAll(key);
      officers.push(officer);
    }

    if (officers.length === 0) {
      return res.status(404).json({ message: "No officers found" });
    }

    res.json(officers);
  } catch (err) {
    console.error("❌ Error fetching officers:", err);
    res.status(500).json({ message: "Failed to fetch officers" });
  }
});


// Update an officer
app.put("/update-officer/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const officerKey = `officer:${id}`;

    // Update officer data
    const updatedData = req.body;

    // Set updated data in Redis hash (similar to the approach for adding a new officer)
    for (const [key, value] of Object.entries(updatedData)) {
      await redisClient.hSet(officerKey, key, value);
    }

    console.log(`✅ Officer ${id} updated successfully.`);
    res.json({ message: "Officer updated", updatedOfficer: updatedData });
  } catch (err) {
    console.error("❌ Error updating officer:", err);
    res.status(500).json({ message: "Failed to update officer", error: err.message });
  }
});

// Delete an officer
app.delete("/delete-officer/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const officerKey = `officer:${id}`;

    // Delete the officer's record from Redis
    await redisClient.del(officerKey);

    console.log(`✅ Officer ${id} deleted successfully.`);
    res.json({ message: "Officer deleted" });
  } catch (err) {
    console.error("❌ Error deleting officer:", err);
    res.status(500).json({ message: "Failed to delete officer", error: err.message });
  }
});

// Update officer details (including role)
app.put("/update-officer/:id", async (req, res) => {
  try {
    const { id } = req.params; // Get officer's ID from URL
    const officerKey = `officer:${id}`; // Use the officer's ID as the Redis key

    // Check if officer exists
    const officerExists = await redisClient.exists(officerKey);
    if (!officerExists) {
      return res.status(404).json({ message: "Officer not found" });
    }

    const officerData = req.body; // Get updated officer data from request body

    // Update the officer's data in Redis
    for (const [key, value] of Object.entries(officerData)) {
      await redisClient.hSet(officerKey, key, value); // Update each field
    }

    console.log(`✅ Officer ${id}'s data updated successfully.`);
    res.json({ message: "Officer updated successfully" });
  } catch (err) {
    console.error("❌ Error updating officer:", err);
    res.status(500).json({ message: "Failed to update officer", error: err.message });
  }
});

// Example API to get the count of residents and officers
app.get('/user-counts', async (req, res) => {
  try {
    // Count the number of keys for residents and officers in Redis
    const residentsKeys = await redisClient.keys('resident:*');
    const officersKeys = await redisClient.keys('officer:*');

    // Return counts of residents and officers
    res.json({
      residentsCount: residentsKeys.length,
      officersCount: officersKeys.length,
    });
  } catch (err) {
    console.error('Error fetching user counts:', err);
    res.status(500).json({ error: 'Failed to get user counts' });
  }
});

let homePageViewCount = 0;  // Variable to store view count for Home page

// This endpoint gets the current view count for the Home page
app.get("/home-views", (req, res) => {
  homePageViewCount++;  // Increment the view count each time it's accessed
  res.json({ views: homePageViewCount });  // Send the updated view count
});

// ✅ API to Get Resident Details by ID
app.get('/api/residents/:id', async (req, res) => {
  try {
      const residentId = req.params.id;
      const data = await redisClient.get(`resident:${residentId}`);
      if (data) {
          return res.json(JSON.parse(data));
      } else {
          return res.status(404).json({ message: 'Resident not found' });
      }
  } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ message: 'Server error' });
  }
});

app.post("/api/generate-clearance", async (req, res) => {
  try {
      console.log("Received clearance request:", req.body);

      const { residentId } = req.body;
      if (!residentId) {
          return res.status(400).json({ error: "Resident ID is required" });
      }

      console.log("Fetching resident from Redis:", `resident:${residentId}`);
      const resident = await redisClient.hGetAll(`resident:${residentId}`);

      if (!resident || Object.keys(resident).length === 0) {
          console.log("Resident not found in Redis:", residentId);
          return res.status(404).json({ error: "Resident not found" });
      }

      console.log("Resident data retrieved:", resident);

      const clearanceData = {
          fullName: `${resident.firstName} ${resident.lastName}`,
          address: `${resident.street}, Purok ${resident.purok}`,
          age: `${resident.age}`,
          status: "Cleared",
          issuedDate: new Date().toLocaleDateString(),
      };

      console.log("Clearance data:", clearanceData);
      res.json(clearanceData);
  } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ error: "Server error" });
  }
});

// Route for uploading residents CSV
app.post("/residents/upload-csv", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  let results = []; // ✅ Ensure results is defined

  // Read CSV file
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        for (const resident of results) {
          const {
            id, firstName, lastName, middleInitial, street, purok, gender, age, 
            birthDate, birthPlace, barangay, citizenship, civilStatus, religion, 
            occupation, email, contactNumber, annualIncome, beneficiaryStatus, status
          } = resident;

          // Validate required fields (Skip if ID, First Name, or Last Name is missing)
          if (!id || !firstName || !lastName || !middleInitial) {
            console.warn(`⚠️ Skipping resident: Missing required fields (ID: ${id})`);
            continue;
          }

          // Store new resident in Redis
          await redisClient.hSet(`resident:${id}`, "id", id || "");
          await redisClient.hSet(`resident:${id}`, "firstName", firstName || "");
          await redisClient.hSet(`resident:${id}`, "lastName", lastName || "");
          await redisClient.hSet(`resident:${id}`, "middleInitial", middleInitial || "");
          await redisClient.hSet(`resident:${id}`, "street", street || "");
          await redisClient.hSet(`resident:${id}`, "purok", purok || "");
          await redisClient.hSet(`resident:${id}`, "gender", gender || "");
          await redisClient.hSet(`resident:${id}`, "age", age || "");
          await redisClient.hSet(`resident:${id}`, "birthDate", birthDate || "");
          await redisClient.hSet(`resident:${id}`, "birthPlace", birthPlace || "");
          await redisClient.hSet(`resident:${id}`, "barangay", barangay || "");
          await redisClient.hSet(`resident:${id}`, "citizenship", citizenship || "");
          await redisClient.hSet(`resident:${id}`, "civilStatus", civilStatus || "");
          await redisClient.hSet(`resident:${id}`, "religion", religion || "");
          await redisClient.hSet(`resident:${id}`, "occupation", occupation || "");
          await redisClient.hSet(`resident:${id}`, "email", email || "");
          await redisClient.hSet(`resident:${id}`, "contactNumber", contactNumber || "");
          await redisClient.hSet(`resident:${id}`, "annualIncome", annualIncome || "");
          await redisClient.hSet(`resident:${id}`, "beneficiaryStatus", beneficiaryStatus || "");
          await redisClient.hSet(`resident:${id}`, "status", status || "Active"); // Default to Active

        }

        fs.unlinkSync(req.file.path); // Clean up uploaded CSV file
        res.json({ message: 'CSV data uploaded and processed successfully', data: results });
      } catch (error) {
        console.error('Error saving CSV data:', error);
        res.status(500).json({ message: 'Failed to process CSV' });
      }

    });
  });

  // Fetch all residents' socioeconomic data
app.get("/socioeconomic-data", async (req, res) => {
  try {
    const residents = await redisClient.hGetAll("residents"); // Fetch all residents stored in Redis
    if (!residents) {
      return res.status(404).json({ message: "No resident data found." });
    }

    // Convert Redis hash object to an array
    const residentList = Object.values(residents).map((resident) =>
      JSON.parse(resident)
    );

    // Return only relevant socioeconomic information
    const socioData = residentList.map((resident) => ({
      id: resident.id,
      firstName: resident.firstName,
      middleInitial: resident.middleInitial || "",
      lastName: resident.lastName,
      occupation: resident.occupation || "N/A",
      annualIncome: resident.annualIncome || 0,
      beneficiaryStatus: resident.beneficiaryStatus || "N/A",
    }));

    res.json(socioData);
  } catch (error) {
    console.error("Error fetching socioeconomic data:", error);
    res.status(500).json({ message: "Server error retrieving data." });
  }
});



// ✅ Start server
app.listen(3000, () => {
  console.log("🚀 Backend is running on http://localhost:3000");
});
