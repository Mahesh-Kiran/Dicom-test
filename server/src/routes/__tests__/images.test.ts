import request from 'supertest';
import express from 'express';
import imagesRouter from '../images';

const app = express();
app.use(express.json());
app.use('/api/images', imagesRouter);

describe('Images API Routes', () => {
  describe('POST /api/images/upload', () => {
    it('should return 400 when no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/images/upload')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'BAD_REQUEST');
      expect(response.body).toHaveProperty('message', 'No file uploaded');
    });
  });

  describe('GET /api/images/:id/manifest', () => {
    it('should return 404 for non-existent image', async () => {
      const response = await request(app)
        .get('/api/images/non-existent-id/manifest')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'NOT_FOUND');
      expect(response.body).toHaveProperty('message', 'Image not found');
    });
  });

  describe('DELETE /api/images/:id', () => {
    it('should return 404 for non-existent image', async () => {
      const response = await request(app)
        .delete('/api/images/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'NOT_FOUND');
      expect(response.body).toHaveProperty('message', 'Image not found');
    });
  });
});
