# FocusFlow Study Timer App

FocusFlow is our CS346 semester project for building a study timer web application with Node.js, Express, EJS, and PostgreSQL.

## Features

- 🚀 **Node.js 20** + **Express 4** - Modern JavaScript backend
- 🎨 **EJS** - Server-side templating
- 🗄️ **PostgreSQL** - Reliable relational database
- 🔒 **Security First** - Helmet, CSRF protection, secure sessions
- 📝 **Clean Code** - ESLint, Prettier, best practices
- 🎓 **Educational** - Well-documented, instructional code

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/UWO-CS346-Fall-25/cs346f25-study-timer-pomodoro-app.git
   cd cs346f25-study-timer-pomodoro-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Set up PostgreSQL database**
   ```bash
   # Create database (adjust credentials as needed)
   createdb your_database_name
   ```

5. **Run migrations**
   ```bash
   npm run migrate
   ```

6. **Seed database (optional)**
   ```bash
   npm run seed
   ```

7. **Start the application**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   ```
   http://localhost:3000
   ```

## Current Pages (Deliverable 1)

The Week 7 HTML/CSS deliverable focuses on the static structure of the FocusFlow study timer. The Express app now serves four EJS pages with shared navigation and footer:

- Home (``) – High-level overview of FocusFlow with hero messaging, feature highlights, and workflow steps.
- Focus Sessions (`/focus`) – Static mock of the timer controls, preset selector, and session queue layout.
- Progress Insights (`/insights`) – Dashboard-style placeholders showing weekly metrics, recent sessions, and reflection prompts.
- About (`/about`) – Team introduction plus the goals for this deliverable.

All pages share the new FocusFlow color palette and component styles, including background colors and interactive button states defined in `src/public/css/style.css`. Content remains static by design; JavaScript logic and data integration will arrive later.


## Current Pages (Deliverable 2)
The Week 8 deliverable focuses on the Interactive Pages of the Focus Sessions in the FocusFlow study timer and the Basic Server Logic.
- **Ab (server & data)**
  - Hold session data in memory (or seed JSON) and pass it to EJS.
  - Handle POST `/focus/sessions`, validate input, and set flash messages.
  - Return a JSON API (`/api/sessions`) that Dasha’s JS can call.
  - Write the front-end JS to create live updates for the form validation.
- **Dasha (client experience)**
  - Write front-end JS to wire preset buttons and form validation.
  - Create an interactive Session queue which displays in the     current interval hero.
  - Show inline success/error states and keep everything keyboard friendly.
  - Polish styling/animations so the new interactions feel smooth.


## Project Structure

```
├── src/
│   ├── server.js           # Server entry point
│   ├── app.js              # Express app configuration
│   ├── routes/             # Route definitions
│   ├── controllers/        # Request handlers
│   ├── models/             # Database models
│   ├── views/              # EJS templates
│   └── public/             # Static files (CSS, JS, images)
├── db/
│   ├── migrations/         # Database migrations
│   ├── seeds/              # Database seeds
│   ├── migrate.js          # Migration runner
│   ├── seed.js             # Seed runner
│   └── reset.js            # Database reset script
├── docs/                   # Documentation
│   ├── README.md           # Documentation overview
│   ├── SETUP.md            # Setup guide
│   └── ARCHITECTURE.md     # Architecture details
├── .env.example            # Environment variables template
├── .eslintrc.json          # ESLint configuration
├── .prettierrc.json        # Prettier configuration
└── package.json            # Dependencies and scripts
```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with sample data
- `npm run reset` - Reset database (WARNING: deletes all data!)
- `npm run lint` - Check code for linting errors
- `npm run lint:fix` - Fix linting errors automatically
- `npm run format` - Format code with Prettier

## Security Features

- **Helmet**: Sets security-related HTTP headers
- **express-session**: Secure session management with httpOnly cookies
- **csurf**: Cross-Site Request Forgery (CSRF) protection
- **Parameterized SQL**: SQL injection prevention with prepared statements
- **Environment Variables**: Sensitive data kept out of source code

## Documentation

Comprehensive documentation is available in the `docs/` folder:

- [docs/README.md](docs/README.md) - Documentation overview
- [docs/SETUP.md](docs/SETUP.md) - Detailed setup instructions
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Architecture and design patterns

## Technology Stack

- **Runtime**: Node.js 20
- **Framework**: Express 4
- **Templating**: EJS
- **Database**: PostgreSQL (with pg driver)
- **Security**: Helmet, express-session, csurf
- **Development**: ESLint, Prettier, Nodemon

## Learning Resources

- [Express.js Documentation](https://expressjs.com/)
- [EJS Documentation](https://ejs.co/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [OWASP Security Guide](https://owasp.org/)

## Contributing

This is a teaching template. Feel free to:
- Report issues
- Suggest improvements
- Submit pull requests
- Use it for your own projects

## License

ISC
