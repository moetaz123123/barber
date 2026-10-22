import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import publicRoutes from './routes/publicRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.clientOrigin,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '100kb' }));

app.get('/', (_req, res) => {
  res.json({ name: 'Barber Booking API', docs: '/api/health' });
});

app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`API démarrée sur http://localhost:${config.port}`);
    console.log(`CORS autorisé pour : ${config.clientOrigin}`);
  });
}

export default app;
