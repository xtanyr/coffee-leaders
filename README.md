# Coffee Shop Leaders Monitor

A simple web application to monitor and manage coffee shop leaders.

## Features

- View all leaders in a list
- Filter leaders by city
- View statistics about leaders
- Add, edit, and remove leaders
- Simple REST API for integration

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```

The server will start at http://localhost:3000

### Production Build
```bash
npm run build
npm start
```

## API Endpoints

- `GET /api/leaders` - Get all leaders
- `GET /api/leaders/city/:city` - Get leaders by city
- `GET /api/leaders/stats` - Get leader statistics
- `POST /api/leaders` - Create a new leader
- `PUT /api/leaders/:id` - Update a leader
- `DELETE /api/leaders/:id` - Delete a leader

## Data Model

Leader:
- id: number (auto-generated)
- name: string
- startDate: Date (format: YYYY-MM-DD)
- age: number
- city: string
- coffeeShop: string
- createdAt: Date (auto-generated)
- updatedAt: Date (auto-generated)

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. Use a process manager like PM2 to keep the application running:
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name "coffee-leaders"
   ```

## License

MIT
