# Bodh Script Club - Official Website

A modern, full-stack web application for managing college club activities, events, members, and content.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Create admin user
npm run create-admin
```


## ✨ Features

### Public Features
- 🏠 **Home Page** - Modern landing page with animations
- 📅 **Events** - Browse and register for club events
- 👥 **Members** - View team members with roles
- 🖼️ **Gallery** - Photo collections from events
- 💬 **Testimonials** - User feedback and reviews
- ℹ️ **About** - Club information and achievements
- 📝 **Join Us** - Application form for new members

### Admin Features
- 📊 **Dashboard** - Overview with statistics
- ✅ **Join Requests** - Approve/reject applications
- 🎯 **Events Management** - Create, edit, delete events
- 👤 **Members Management** - Manage team members
- 🖼️ **Gallery Management** - Upload and organize photos
- 💬 **Testimonials** - Review and approve feedback
- 📥 **Export Data** - Download Excel reports

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **GSAP** - Animations
- **React Router** - Navigation
- **Axios** - HTTP client
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads
- **XLSX** - Excel export

## 📁 Project Structure

```
bodh-script-club/
├── api/                    # Backend API
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   └── middleware/        # Auth middleware
├── scripts/               # Database seed scripts
├── src/                   # Frontend React app
│   ├── components/       # Reusable components
│   ├── context/          # React context
│   ├── pages/            # Page components
│   └── utils/            # Utility functions
├── uploads/               # File uploads directory
├── server.js             # Express server
├── package.json          # Dependencies
└── .env                  # Environment variables
```

## 🔧 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- Git

### Setup

1. **Clone Repository**
   ```bash
   git clone <your-repo-url>
   cd bodh-script-club
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   
   Create/update `.env` file:
   ```env
   # Frontend
   VITE_API_URL=http://localhost:5000/api

   # Backend
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret
   NODE_ENV=development
   ```

4. **Create Admin User**
   ```bash
   npm run create-admin
   ```

5. **Seed Database (Optional)**
   ```bash
   npm run seed-about
   npm run seed-events
   npm run seed-gallery
   npm run seed-members
   npm run seed-testimonials
   ```

6. **Start Development**
   ```bash
   npm run dev
   ```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run both frontend and backend |
| `npm run dev:frontend` | Run frontend only (Vite) |
| `npm run dev:backend` | Run backend only (Express) |
| `npm start` | Start production server |
| `npm run build` | Build frontend for production |
| `npm run create-admin` | Create admin user |
| `npm run seed-about` | Seed about page data |
| `npm run seed-events` | Seed events data |
| `npm run seed-gallery` | Seed gallery data |
| `npm run seed-members` | Seed members data |
| `npm run seed-testimonials` | Seed testimonials data |

## 🌐 API Endpoints

All endpoints are prefixed with `/api`:

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create event (admin)
- `PUT /api/events/:id` - Update event (admin)
- `DELETE /api/events/:id` - Delete event (admin)
- `POST /api/events/:id/register` - Register for event
- `GET /api/events/:id/registrations` - Get registrations (admin)

### Members
- `GET /api/members` - Get all members
- `POST /api/members` - Add member (admin)
- `PUT /api/members/:id` - Update member (admin)
- `DELETE /api/members/:id` - Delete member (admin)

### Gallery
- `GET /api/gallery` - Get gallery items
- `POST /api/gallery` - Add gallery item (admin)
- `PUT /api/gallery/:id` - Update gallery item (admin)
- `DELETE /api/gallery/:id` - Delete gallery item (admin)

### Testimonials
- `GET /api/testimonials` - Get approved testimonials
- `POST /api/testimonials/submit` - Submit testimonial
- `GET /api/testimonials/all` - Get all testimonials (admin)
- `PUT /api/testimonials/:id` - Update testimonial (admin)
- `DELETE /api/testimonials/:id` - Delete testimonial (admin)

### Submissions
- `GET /api/submissions` - Get all submissions (admin)
- `POST /api/submissions` - Submit join request
- `PUT /api/submissions/:id` - Update submission status (admin)
- `GET /api/submissions/export` - Export to Excel (admin)

## 🚀 Deployment

### Recommended: Render

1. Create account at [render.com](https://render.com)
2. New Web Service → Connect GitHub
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add environment variables
5. Deploy!

See `DEPLOYMENT_GUIDE.md` for detailed instructions for multiple platforms.

### Other Options
- Railway
- Vercel
- Heroku
- DigitalOcean

## 📚 Documentation

- 📖 [Project Structure](PROJECT_STRUCTURE.md) - Detailed structure guide
- 🚀 [Deployment Guide](DEPLOYMENT_GUIDE.md) - Step-by-step deployment
- ✅ [Migration Complete](MIGRATION_COMPLETE.md) - What changed
- 🎯 [Quick Start](QUICK_START.md) - Get started quickly
- 📋 [Admin Features](ADMIN_FEATURES.md) - Admin dashboard guide
- 💬 [Testimonials Guide](TESTIMONIALS_GUIDE.md) - Testimonials system

## 🔐 Default Credentials


⚠️ **Important**: Change these credentials in production!

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Team

Developed by Bodh Script Club Team

## 📧 Support

For issues or questions:
- Create an issue on GitHub
- Contact: admin@bodh.com

## 🎯 Roadmap

- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] Social media integration
- [ ] Payment gateway
- [ ] Certificate generation

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

**Made with ❤️ by Bodh Script Club**
