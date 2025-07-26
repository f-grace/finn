# CareerConnect Platform

A comprehensive B2B SaaS platform designed to help colleges and universities improve their students' career outcomes through alumni networking, mentorship, and career analytics.

## 🎯 Overview

CareerConnect is the perfect blend of Handshake and LinkedIn, specifically designed for educational institutions. It addresses the pain point of tracking networking activities, finding relevant alumni connections, managing outreach campaigns, and providing analytics to improve job placement rates.

### Key Features

- **Alumni Networking**: Connect students with successful alumni across industries and locations
- **Career Analytics**: Track job placement rates, salary data, and career progression metrics
- **Outreach Management**: Comprehensive tools for managing networking campaigns and follow-ups
- **Mentorship Programs**: Facilitate meaningful mentor-mentee relationships
- **Institution Dashboard**: Analytics and insights for career services departments
- **Global Alumni Map**: Visual representation of alumni distribution worldwide

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd career-connect-platform
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/career-connect
   
   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key
   
   # Email Configuration (Gmail example)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=noreply@careerconnect.com
   
   # Cloud Storage (optional)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   # Stripe (for payments)
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_WEBHOOK_SECRET=your-webhook-secret
   ```

5. **Start the development servers**

   **Terminal 1 - Backend:**
   ```bash
   npm run dev
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd client
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
career-connect-platform/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   └── styles/        # CSS and styling
│   └── public/            # Static assets
├── models/                # MongoDB models
├── routes/                # API routes
├── middleware/            # Express middleware
├── utils/                 # Utility functions
├── server.js             # Express server
└── package.json          # Backend dependencies
```

## 🏗️ Architecture

### Backend (Node.js + Express + MongoDB)

- **Models**: Comprehensive data models for users, institutions, connections, and outreach
- **Routes**: RESTful API endpoints for all platform features
- **Middleware**: Authentication, validation, and security middleware
- **Utils**: Email services, file upload, and helper functions

### Frontend (React + Tailwind CSS)

- **Components**: Modular, reusable UI components
- **Pages**: Main application pages with routing
- **Contexts**: Global state management for authentication and theme
- **Services**: API integration and data fetching

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password/:token` - Reset password

### Networking
- `GET /api/networking/discover` - Discover potential connections
- `POST /api/networking/connect` - Send connection request
- `PUT /api/networking/connections/:id` - Accept/decline connection
- `GET /api/networking/connections` - Get user connections
- `POST /api/networking/outreach` - Send outreach message
- `GET /api/networking/outreach` - Get outreach history
- `GET /api/networking/alumni-map` - Get alumni distribution

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/search` - Search users

### Analytics
- `GET /api/analytics/dashboard` - Dashboard analytics
- `GET /api/analytics/placement` - Job placement analytics
- `GET /api/analytics/network` - Network growth analytics

## 🎨 Features in Detail

### For Students
- **Profile Management**: Complete professional profiles with work experience, education, and skills
- **Alumni Discovery**: Find and connect with alumni by industry, location, company, or graduation year
- **Outreach Tools**: Send personalized messages and track responses
- **Career Tracking**: Monitor job applications and career progress
- **Mentorship**: Find and connect with mentors in their field

### For Alumni
- **Network Building**: Connect with fellow alumni and current students
- **Mentorship Opportunities**: Offer guidance to current students
- **Career Updates**: Share career progress and achievements
- **Event Participation**: Engage with institutional events and programs

### For Institutions
- **Analytics Dashboard**: Comprehensive insights into career outcomes
- **Alumni Engagement**: Track and improve alumni participation
- **Job Placement Metrics**: Monitor and improve placement rates
- **Resource Management**: Manage career services resources and staff

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting and request validation
- CORS protection
- Helmet.js security headers
- Input sanitization and validation

## 📊 Analytics & Reporting

- Job placement rates by program and year
- Salary progression analytics
- Network growth metrics
- Alumni engagement tracking
- Geographic distribution of alumni
- Industry and company analytics

## 🚀 Deployment

### Production Build

1. **Build the frontend**
   ```bash
   cd client
   npm run build
   cd ..
   ```

2. **Set production environment variables**
   ```env
   NODE_ENV=production
   MONGODB_URI=your-production-mongodb-uri
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

### Docker Deployment

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN cd client && npm install && npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@careerconnect.com or create an issue in the repository.

## 🔮 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics and AI insights
- [ ] Integration with popular LMS platforms
- [ ] White-label solutions for institutions
- [ ] Advanced mentorship matching algorithms
- [ ] Video conferencing integration
- [ ] Job board integration
- [ ] Advanced reporting and exports

---

**CareerConnect** - Empowering institutions to build stronger alumni networks and improve career outcomes.