"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const leaders_1 = __importDefault(require("./routes/leaders"));
const coffeeShops_1 = __importDefault(require("./routes/coffeeShops"));
const audit_1 = __importDefault(require("./routes/audit"));
const analytics_1 = __importDefault(require("./routes/analytics"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3011;
const parseOrigins = (value) => value
    ?.split(',')
    .map(origin => origin.trim())
    .filter(Boolean) ?? [];
const localDevOrigins = [
    'http://localhost:3100',
    'http://127.0.0.1:3100',
    'http://localhost:6001',
    'http://127.0.0.1:6001',
];
const configuredOrigins = parseOrigins(process.env.CORS_ORIGIN);
const allowedOrigins = process.env.NODE_ENV === 'development'
    ? [...new Set([...configuredOrigins, ...localDevOrigins])]
    : configuredOrigins;
if (process.env.NODE_ENV !== 'development' && allowedOrigins.length === 0) {
    console.warn('CORS_ORIGIN is not set — cross-origin browser requests will be blocked. Set CORS_ORIGIN to your frontend URL(s), comma-separated.');
}
// Middleware
const corsOptions = {
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// Routes
app.use('/api/leaders', leaders_1.default);
app.use('/api/coffee-shops', coffeeShops_1.default);
app.use('/api/audit', audit_1.default);
app.use('/api/analytics', analytics_1.default);
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});
// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map