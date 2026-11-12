
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const dotenv = require('dotenv')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

dotenv.config()

const app = express()

// ================= BASIC CONFIGURATION =================

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// ================= IMAGE UPLOAD CONFIGURATION =================

const uploadDir = path.join(__dirname, 'uploads')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Serve uploaded images
app.use('/uploads', express.static(uploadDir))

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase()
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`

    cb(null, uniqueName)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPG, PNG and WEBP images are allowed'))
    }
  }
})

// Delete an uploaded image safely
function deleteImage(imageUrl) {
  if (!imageUrl) return

  const filename = path.basename(imageUrl)
  const imagePath = path.join(uploadDir, filename)

  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath)
  }
}

// ================= DATABASE MODELS =================

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  }
}, { timestamps: true })

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Lost', 'Found'],
    required: true
  },
  location: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Open', 'Claimed', 'Resolved'],
    default: 'Open'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true })

const User = mongoose.model('User', userSchema)
const Item = mongoose.model('Item', itemSchema)

// ================= AUTHENTICATION =================

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      message: 'Authentication required'
    })
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    return res.status(403).json({
      message: 'Invalid or expired token'
    })
  }
}

// ================= BASIC ROUTE =================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Lost & Found MERN API is running',
    database: mongoose.connection.readyState === 1
      ? 'Connected'
      : 'Disconnected'
  })
})

// ================= REGISTER =================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'All fields are required'
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters'
      })
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase()
    })

    if (existingUser) {
      return res.status(409).json({
        message: 'Email is already registered'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    })

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Registration error:', error)

    res.status(500).json({
      message: 'Registration failed'
    })
  }
})

// ================= LOGIN =================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      })
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    })

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: 'Invalid email or password'
      })
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)

    res.status(500).json({
      message: 'Login failed'
    })
  }
})

// ================= USER PROFILE =================

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      })
    }

    res.json(user)
  } catch (error) {
    res.status(500).json({
      message: 'Could not fetch profile'
    })
  }
})

// ================= GET ALL OPEN ITEMS =================

app.get('/api/items', async (req, res) => {
  try {
    const {
      type,
      category,
      search,
      page = 1,
      limit = 12
    } = req.query

    const filter = { status: 'Open' }

    if (type) filter.type = type
    if (category) filter.category = category

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ]
    }

    const items = await Item.find(filter)
      .populate('owner', 'name')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))

    const total = await Item.countDocuments(filter)

    res.json({
      items,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    })
  } catch (error) {
    console.error('Fetch items error:', error)

    res.status(500).json({
      message: 'Could not fetch items'
    })
  }
})

// ================= GET MY REPORTS =================

app.get('/api/items/mine', authenticateToken, async (req, res) => {
  try {
    const items = await Item.find({
      owner: req.user.id
    })
      .populate('owner', 'name')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      items
    })
  } catch (error) {
    console.error('My reports error:', error)

    res.status(500).json({
      message: 'Could not fetch your reports'
    })
  }
})

// ================= CREATE ITEM WITH IMAGE =================

app.post(
  '/api/items',
  authenticateToken,
  upload.single('image'),
  async (req, res) => {
    try {
      const {
        name,
        category,
        type,
        location,
        date,
        description
      } = req.body

      if (!name || !category || !type || !location || !date || !description) {
        if (req.file) deleteImage(`/uploads/${req.file.filename}`)

        return res.status(400).json({
          message: 'Please complete all fields'
        })
      }

      const item = await Item.create({
        name,
        category,
        type,
        location,
        date,
        description,
        image: req.file ? `/uploads/${req.file.filename}` : '',
        owner: req.user.id
      })

      res.status(201).json({
        message: 'Item reported successfully',
        item
      })
    } catch (error) {
      if (req.file) deleteImage(`/uploads/${req.file.filename}`)

      console.error('Create item error:', error)

      res.status(500).json({
        message: 'Could not create item'
      })
    }
  }
)

// ================= UPDATE ITEM WITH OPTIONAL IMAGE =================

app.patch(
  '/api/items/:id',
  authenticateToken,
  upload.single('image'),
  async (req, res) => {
    try {
      const item = await Item.findOne({
        _id: req.params.id,
        owner: req.user.id
      })

      if (!item) {
        if (req.file) deleteImage(`/uploads/${req.file.filename}`)

        return res.status(404).json({
          message: 'Item not found or not yours'
        })
      }

      const allowedFields = [
        'name',
        'category',
        'type',
        'location',
        'date',
        'description',
        'status'
      ]

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          item[field] = req.body[field]
        }
      })

      if (req.file) {
        deleteImage(item.image)
        item.image = `/uploads/${req.file.filename}`
      }

      await item.save()

      res.json({
        message: 'Item updated successfully',
        item
      })
    } catch (error) {
      if (req.file) deleteImage(`/uploads/${req.file.filename}`)

      console.error('Update item error:', error)

      res.status(500).json({
        message: 'Could not update item'
      })
    }
  }
)

// ================= DELETE ITEM =================

app.delete('/api/items/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Item.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id
    })

    if (!item) {
      return res.status(404).json({
        message: 'Item not found or not yours'
      })
    }

    deleteImage(item.image)

    res.json({
      message: 'Item deleted successfully'
    })
  } catch (error) {
    console.error('Delete item error:', error)

    res.status(500).json({
      message: 'Could not delete item'
    })
  }
})

// ================= ERROR HANDLER =================

app.use((err, req, res, next) => {
  console.error('Server error:', err.message)

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'Image must be smaller than 5 MB'
      })
    }

    return res.status(400).json({
      message: err.message
    })
  }

  if (err.message.includes('Only JPG, PNG and WEBP')) {
    return res.status(400).json({
      message: err.message
    })
  }

  res.status(500).json({
    message: 'Internal server error'
  })
})

// ================= START SERVER =================

const PORT = process.env.PORT || 5000

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully!')

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`)
    })
  })
  .catch(error => {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  })
