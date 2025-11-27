const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

// ----------------------
//  MONGOOSE CONNECTION
// ----------------------
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

// ----------------------
//       SCHEMAS
// ----------------------
const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
})

const exerciseSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date
})

const User = mongoose.model("User", userSchema)
const Exercise = mongoose.model("Exercise", exerciseSchema)

// ----------------------
//  CREATE USER
// ----------------------
app.post("/api/users", async (req, res) => {
  const username = req.body.username

  const newUser = new User({ username })
  await newUser.save()

  res.json({
    username: newUser.username,
    _id: newUser._id
  })
})

// ----------------------
//  GET ALL USERS
// ----------------------
app.get("/api/users", async (req, res) => {
  const users = await User.find({})
  res.json(users)
})

// ----------------------
// ADD EXERCISE
// ----------------------
app.post("/api/users/:_id/exercises", async (req, res) => {
  const userId = req.params._id
  const { description, duration, date } = req.body

  const user = await User.findById(userId)
  if (!user) return res.json({ error: "User not found" })

  let useDate = date ? new Date(date) : new Date()

  const exercise = new Exercise({
    userId,
    description,
    duration: Number(duration),
    date: useDate
  })

  await exercise.save()

  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
    _id: user._id
  })
})

// ----------------------
// GET LOGS
// ----------------------
app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id
  const { from, to, limit } = req.query

  const user = await User.findById(userId)
  if (!user) return res.json({ error: "User not found" })

  let filter = { userId }

  // Filtro de fechas
  if (from || to) {
    filter.date = {}
    if (from) filter.date.$gte = new Date(from)
    if (to) filter.date.$lte = new Date(to)
  }

  let query = Exercise.find(filter)

  // Límite
  if (limit) query = query.limit(Number(limit))

  const exercises = await query.exec()

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log: exercises.map(ex => ({
      description: ex.description,
      duration: ex.duration,
      date: ex.date.toDateString()
    }))
  })
})

// ----------------------
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
